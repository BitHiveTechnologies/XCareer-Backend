"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelSubscription = exports.getPaymentStatus = exports.handleWebhook = exports.getPaymentHistory = exports.verifyPayment = exports.createOrder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const environment_1 = require("../../config/environment");
const Subscription_1 = require("../../models/Subscription");
const User_1 = require("../../models/User");
const paymentService_1 = require("../../utils/paymentService");
const logger_1 = require("../../utils/logger");
const getUserByRequest = async (req) => {
    if (req.user?.id == null)
        return null;
    try {
        // Try by ObjectId first if it's potentially a valid ID
        if (mongoose_1.default.Types.ObjectId.isValid(req.user.id)) {
            const byId = await User_1.User.findById(req.user.id);
            if (byId)
                return byId;
        }
        // Fallback to clerkUserId or other string IDs
        const byClerk = await User_1.User.findOne({ clerkUserId: req.user.id });
        if (byClerk)
            return byClerk;
        // Last resort: find by email
        if (req.user?.email) {
            return await User_1.User.findOne({ email: req.user.email });
        }
    }
    catch (error) {
        logger_1.logger.error('Error fetching user for payment request', {
            userId: req.user.id,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    return null;
};
const normalizePaymentStatus = (status) => {
    switch ((status || '').toUpperCase()) {
        case 'SUCCESS':
            return 'SUCCESS';
        case 'FAILED':
            return 'FAILED';
        case 'USER_DROPPED':
            return 'USER_DROPPED';
        case 'REFUNDED':
            return 'REFUNDED';
        case 'CANCELLED':
            return 'CANCELLED';
        case 'PENDING':
            return 'PENDING';
        default:
            return 'CREATED';
    }
};
const mapPaymentToSubscriptionStatus = (paymentStatus) => {
    switch (normalizePaymentStatus(paymentStatus)) {
        case 'SUCCESS':
            return 'completed';
        case 'FAILED':
            return 'failed';
        case 'REFUNDED':
            return 'refunded';
        case 'CANCELLED':
        case 'USER_DROPPED':
            return 'cancelled';
        case 'PENDING':
        case 'CREATED':
        default:
            return 'pending';
    }
};
const buildSubscriptionResponse = (subscription, paymentDetails) => ({
    id: subscription._id,
    plan: subscription.plan,
    status: subscription.status,
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    expiresAt: subscription.endDate,
    amount: subscription.amount,
    paymentId: subscription.paymentId,
    orderId: subscription.orderId,
    paymentSessionId: subscription.paymentSessionId,
    paymentStatus: subscription.paymentStatus,
    isActive: typeof subscription.isActive === 'function' ? subscription.isActive() : subscription.status === 'completed',
    isExpired: typeof subscription.isExpired === 'function' ? subscription.isExpired() : false,
    daysRemaining: typeof subscription.getDaysRemaining === 'function' ? subscription.getDaysRemaining() : 0,
    daysSinceStart: typeof subscription.getDaysSinceStart === 'function' ? subscription.getDaysSinceStart() : 0,
    features: (0, paymentService_1.getPlanDetails)(subscription.plan)?.features || [],
    payment: paymentDetails || null
});
const upsertSubscriptionFromCashfreePayment = async (params) => {
    const now = new Date();
    const endDate = (0, paymentService_1.calculateSubscriptionEndDate)(params.plan, now);
    const normalizedPaymentStatus = normalizePaymentStatus(params.paymentStatus);
    const subscriptionStatus = mapPaymentToSubscriptionStatus(normalizedPaymentStatus);
    let subscription = await Subscription_1.Subscription.findOne({ userId: params.userId, orderId: params.orderId });
    if (subscription == null && params.paymentId) {
        subscription = await Subscription_1.Subscription.findOne({ userId: params.userId, paymentId: params.paymentId });
    }
    if (subscription) {
        subscription.plan = params.plan;
        subscription.amount = params.amount;
        subscription.orderId = params.orderId;
        subscription.paymentId = params.paymentId || subscription.paymentId || '';
        subscription.paymentSessionId = params.paymentSessionId || subscription.paymentSessionId || '';
        subscription.paymentStatus = normalizedPaymentStatus;
        subscription.status = subscriptionStatus;
        if (normalizedPaymentStatus === 'SUCCESS') {
            subscription.startDate = now;
            subscription.endDate = endDate;
        }
        subscription.metadata = {
            ...subscription.metadata,
            ...params.metadata,
            source: params.metadata?.source || subscription.metadata?.source || 'web'
        };
    }
    else {
        subscription = new Subscription_1.Subscription({
            userId: params.userId,
            plan: params.plan,
            amount: params.amount,
            orderId: params.orderId,
            paymentId: params.paymentId || '',
            paymentSessionId: params.paymentSessionId || '',
            provider: 'cashfree',
            paymentStatus: normalizedPaymentStatus,
            status: subscriptionStatus,
            startDate: now,
            endDate,
            metadata: {
                source: params.metadata?.source || 'web',
                campaign: params.metadata?.campaign,
                referrer: params.metadata?.referrer,
                notes: params.metadata?.notes
            }
        });
    }
    await subscription.save();
    if (normalizedPaymentStatus === 'SUCCESS') {
        await User_1.User.findByIdAndUpdate(params.userId, {
            subscriptionPlan: params.plan,
            subscriptionStatus: 'active',
            subscriptionStartDate: subscription.startDate,
            subscriptionEndDate: subscription.endDate
        });
    }
    else if (normalizedPaymentStatus === 'FAILED' || normalizedPaymentStatus === 'USER_DROPPED' || normalizedPaymentStatus === 'CANCELLED') {
        await User_1.User.findByIdAndUpdate(params.userId, {
            subscriptionStatus: 'inactive'
        });
    }
    return subscription;
};
const resolveCashfreePaymentFromOrder = async (orderId, paymentId) => {
    const paymentsResult = await (0, paymentService_1.fetchCashfreeOrderPayments)(orderId);
    if (paymentsResult.success === false) {
        return { success: false, error: paymentsResult.error };
    }
    const payments = (paymentsResult.payments || []);
    if (paymentId) {
        const matched = payments.find(payment => payment?.cf_payment_id === paymentId || payment?.payment_id === paymentId);
        if (matched) {
            return { success: true, payment: matched };
        }
    }
    const successfulPayment = payments.find(payment => String(payment?.payment_status || payment?.status || '').toUpperCase() === 'SUCCESS');
    if (successfulPayment) {
        return { success: true, payment: successfulPayment };
    }
    const latest = payments[0];
    return latest ? { success: true, payment: latest } : { success: false, error: 'No payment found for order' };
};
const createOrder = async (req, res) => {
    try {
        const { plan, amount, currency = 'INR' } = req.body;
        const user = await getUserByRequest(req);
        if (user == null) {
            res.status(401).json({ success: false, error: { message: 'Authentication required' }, timestamp: new Date().toISOString() });
            return;
        }
        if ((0, paymentService_1.validateSubscriptionPlan)(plan) === false) {
            res.status(400).json({ success: false, error: { message: 'Invalid subscription plan' }, timestamp: new Date().toISOString() });
            return;
        }
        const planDetails = (0, paymentService_1.getPlanDetails)(plan);
        if (planDetails == null) {
            res.status(400).json({ success: false, error: { message: 'Invalid subscription plan' }, timestamp: new Date().toISOString() });
            return;
        }
        if (Number(amount) !== planDetails.price) {
            res.status(400).json({
                success: false,
                error: { message: `Amount mismatch for ${plan}. Expected ₹${planDetails.price}.` },
                timestamp: new Date().toISOString()
            });
            return;
        }
        const createResult = await (0, paymentService_1.createCashfreeOrder)({
            userId: String(user._id),
            plan,
            amount: planDetails.price,
            currency,
            customer: {
                customerId: String(user._id),
                email: user.email,
                name: user.email.split('@')[0],
                phone: '9999999999'
            },
            notes: {
                orderNote: `Subscription payment for ${plan}`
            },
            returnUrl: `${environment_1.config.FRONTEND_URL}/profile?payment=success&order_id={order_id}`
        });
        if (createResult.success === false || createResult.order == null) {
            res.status(500).json({
                success: false,
                error: { message: createResult.error || 'Failed to create order' },
                timestamp: new Date().toISOString()
            });
            return;
        }
        const order = createResult.order;
        const subscription = await upsertSubscriptionFromCashfreePayment({
            userId: String(user._id),
            plan,
            amount: planDetails.price,
            orderId: order.orderId,
            paymentSessionId: order.paymentSessionId,
            paymentStatus: 'CREATED',
            metadata: {
                source: 'web',
                notes: 'Created during Cashfree order initiation'
            }
        });
        logger_1.logger.info('Payment order created', {
            userId: String(user._id),
            orderId: order.orderId,
            cfOrderId: order.cfOrderId,
            amount: planDetails.price,
            plan,
            ip: req.ip
        });
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                order: {
                    id: order.orderId,
                    cfOrderId: order.cfOrderId,
                    paymentSessionId: order.paymentSessionId,
                    amount: order.amount,
                    currency: order.currency,
                    status: order.status,
                    orderMeta: order.orderMeta,
                    customerDetails: order.customerDetails,
                    createdAt: order.createdAt
                },
                cashfree: {
                    mode: environment_1.config.CASHFREE_ENV,
                    apiVersion: environment_1.config.CASHFREE_API_VERSION
                },
                subscription: buildSubscriptionResponse(subscription)
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Create order failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({ success: false, error: { message: 'Failed to create order' }, timestamp: new Date().toISOString() });
    }
};
exports.createOrder = createOrder;
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId } = req.body;
        const user = await getUserByRequest(req);
        if (user == null) {
            res.status(401).json({ success: false, error: { message: 'Authentication required' }, timestamp: new Date().toISOString() });
            return;
        }
        if (!orderId) {
            res.status(400).json({ success: false, error: { message: 'orderId is required' }, timestamp: new Date().toISOString() });
            return;
        }
        const subscription = await Subscription_1.Subscription.findOne({
            userId: user._id,
            $or: [{ orderId }, ...(paymentId ? [{ paymentId }] : [])]
        });
        if (subscription == null) {
            res.status(404).json({ success: false, error: { message: 'Subscription not found for order' }, timestamp: new Date().toISOString() });
            return;
        }
        const paymentResult = await resolveCashfreePaymentFromOrder(orderId, paymentId);
        if (paymentResult.success === false || paymentResult.payment == null) {
            res.status(200).json({
                success: true,
                message: 'Payment is still processing',
                data: { status: 'processing', subscription: buildSubscriptionResponse(subscription), payment: null },
                timestamp: new Date().toISOString()
            });
            return;
        }
        const payment = paymentResult.payment;
        const paymentStatus = String(payment.payment_status || payment.status || '').toUpperCase();
        if (paymentStatus === 'SUCCESS') {
            const activeSubscription = await upsertSubscriptionFromCashfreePayment({
                userId: String(user._id),
                plan: subscription.plan,
                amount: subscription.amount,
                orderId,
                paymentId: payment.cf_payment_id || payment.payment_id,
                paymentStatus,
                paymentSessionId: subscription.paymentSessionId,
                metadata: { source: 'api', notes: 'Activated via client-side confirmation after checkout' }
            });
            const paymentDetails = {
                id: payment.cf_payment_id || payment.payment_id,
                status: paymentStatus,
                amount: payment.payment_amount,
                currency: payment.payment_currency || 'INR',
                message: payment.payment_message,
                createdAt: payment.payment_time
            };
            res.status(200).json({
                success: true,
                message: 'Payment verified and subscription activated',
                data: {
                    status: 'completed',
                    subscription: buildSubscriptionResponse(activeSubscription, paymentDetails),
                    payment: paymentDetails
                },
                timestamp: new Date().toISOString()
            });
            return;
        }
        const updatedSubscription = await upsertSubscriptionFromCashfreePayment({
            userId: String(user._id),
            plan: subscription.plan,
            amount: subscription.amount,
            orderId,
            paymentId: payment.cf_payment_id || payment.payment_id,
            paymentStatus,
            paymentSessionId: subscription.paymentSessionId,
            metadata: { source: 'api', notes: 'Updated after client-side confirmation' }
        });
        const responseStatus = paymentStatus === 'SUCCESS'
            ? 'completed'
            : paymentStatus === 'FAILED' || paymentStatus === 'USER_DROPPED' || paymentStatus === 'CANCELLED' || paymentStatus === 'REFUNDED'
                ? 'failed'
                : 'processing';
        res.status(200).json({
            success: true,
            message: 'Payment is not complete yet',
            data: {
                status: responseStatus,
                subscription: buildSubscriptionResponse(updatedSubscription),
                payment: {
                    id: payment.cf_payment_id || payment.payment_id,
                    status: paymentStatus,
                    amount: payment.payment_amount,
                    currency: payment.payment_currency || 'INR',
                    message: payment.payment_message,
                    createdAt: payment.payment_time
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Payment verification failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({ success: false, error: { message: 'Payment verification failed' }, timestamp: new Date().toISOString() });
    }
};
exports.verifyPayment = verifyPayment;
const getPaymentHistory = async (req, res) => {
    try {
        const user = await getUserByRequest(req);
        const { page = 1, limit = 10 } = req.query;
        if (user == null) {
            res.status(401).json({ success: false, error: { message: 'Authentication required' }, timestamp: new Date().toISOString() });
            return;
        }
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const subscriptions = await Subscription_1.Subscription.find({ userId: user._id }).sort({ createdAt: -1 }).skip(skip).limit(limitNum);
        const total = await Subscription_1.Subscription.countDocuments({ userId: user._id });
        const paymentHistory = subscriptions.map(subscription => ({
            id: subscription._id,
            plan: subscription.plan,
            status: subscription.status,
            amount: subscription.amount,
            currency: 'INR',
            paymentStatus: subscription.paymentStatus,
            paymentId: subscription.paymentId,
            orderId: subscription.orderId,
            paymentSessionId: subscription.paymentSessionId,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            createdAt: subscription.createdAt
        }));
        res.status(200).json({
            success: true,
            data: {
                subscriptions: paymentHistory,
                payments: paymentHistory,
                pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get payment history failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({ success: false, error: { message: 'Failed to get payment history' }, timestamp: new Date().toISOString() });
    }
};
exports.getPaymentHistory = getPaymentHistory;
const handleWebhook = async (req, res) => {
    try {
        const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        const verification = (0, paymentService_1.verifyCashfreeWebhookSignature)(rawBody, signature, timestamp);
        if (verification.valid === false) {
            logger_1.logger.warn('Cashfree webhook signature verification failed', {
                reason: verification.reason,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            res.status(400).json({ success: false, error: { message: verification.reason || 'Invalid webhook signature' } });
            return;
        }
        const body = req.body;
        const type = String(body.type || body.event || '').toUpperCase();
        const data = body.data || body.payload || body;
        const order = data?.order || data?.order_details || {};
        const payment = data?.payment || data?.payment_details || {};
        const orderId = order?.order_id || payment?.order_id;
        const paymentId = payment?.cf_payment_id || payment?.payment_id;
        const paymentStatus = payment?.payment_status || payment?.status;
        logger_1.logger.info('Cashfree webhook received', { type, orderId, paymentId, paymentStatus, ip: req.ip });
        if (!orderId) {
            res.status(400).json({ success: false, error: { message: 'Order ID missing from webhook payload' } });
            return;
        }
        const subscription = await Subscription_1.Subscription.findOne({ orderId });
        if (subscription == null) {
            logger_1.logger.warn('Cashfree webhook received for unknown order', { orderId, paymentId, type });
            res.status(200).json({ success: true, message: 'Webhook ignored: unknown order' });
            return;
        }
        const normalized = normalizePaymentStatus(paymentStatus);
        const subscriptionStatus = mapPaymentToSubscriptionStatus(normalized);
        if (subscription.paymentId === paymentId && subscription.paymentStatus === normalized && subscription.status === subscriptionStatus) {
            res.status(200).json({ success: true, message: 'Webhook processed successfully' });
            return;
        }
        subscription.paymentId = paymentId || subscription.paymentId || '';
        subscription.paymentStatus = normalized;
        subscription.provider = 'cashfree';
        subscription.metadata = {
            ...subscription.metadata,
            source: 'cashfree_webhook',
            notes: `Cashfree webhook ${type || normalized}`
        };
        if (normalized === 'SUCCESS') {
            subscription.status = 'completed';
            subscription.startDate = subscription.startDate || new Date();
            subscription.endDate = (0, paymentService_1.calculateSubscriptionEndDate)(subscription.plan, subscription.startDate || new Date());
            await User_1.User.findByIdAndUpdate(subscription.userId, {
                subscriptionPlan: subscription.plan,
                subscriptionStatus: 'active',
                subscriptionStartDate: subscription.startDate,
                subscriptionEndDate: subscription.endDate
            });
        }
        else if (normalized === 'FAILED') {
            subscription.status = 'failed';
            await User_1.User.findByIdAndUpdate(subscription.userId, { subscriptionStatus: 'inactive' });
        }
        else if (normalized === 'USER_DROPPED') {
            subscription.status = 'cancelled';
            await User_1.User.findByIdAndUpdate(subscription.userId, { subscriptionStatus: 'inactive' });
        }
        else if (normalized === 'REFUNDED') {
            subscription.status = 'refunded';
        }
        else if (normalized === 'CANCELLED') {
            subscription.status = 'cancelled';
            await User_1.User.findByIdAndUpdate(subscription.userId, { subscriptionStatus: 'inactive' });
        }
        else {
            subscription.status = 'pending';
        }
        if (payment) {
            subscription.amount = payment.payment_amount || subscription.amount;
        }
        await subscription.save();
        res.status(200).json({ success: true, message: 'Webhook processed successfully' });
    }
    catch (error) {
        logger_1.logger.error('Webhook processing failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip
        });
        res.status(500).json({ success: false, error: { message: 'Webhook processing failed' } });
    }
};
exports.handleWebhook = handleWebhook;
const getPaymentStatus = async (req, res) => {
    try {
        const referenceId = req.params.subscriptionId;
        const user = await getUserByRequest(req);
        if (user == null) {
            res.status(401).json({ success: false, error: { message: 'Authentication required' }, timestamp: new Date().toISOString() });
            return;
        }
        const subscription = await Subscription_1.Subscription.findOne({
            userId: user._id,
            $or: [{ _id: referenceId }, { orderId: referenceId }, { paymentId: referenceId }]
        });
        if (subscription == null) {
            res.status(404).json({ success: false, error: { message: 'Subscription not found' }, timestamp: new Date().toISOString() });
            return;
        }
        let paymentDetails = null;
        if (subscription.orderId) {
            const paymentResult = await resolveCashfreePaymentFromOrder(subscription.orderId, subscription.paymentId || undefined);
            if (paymentResult.success && paymentResult.payment) {
                const payment = paymentResult.payment;
                paymentDetails = {
                    id: payment.cf_payment_id || payment.payment_id,
                    status: payment.payment_status || payment.status,
                    amount: payment.payment_amount,
                    currency: payment.payment_currency,
                    method: payment.payment_method,
                    captured: String(payment.payment_status || payment.status || '').toUpperCase() === 'SUCCESS',
                    createdAt: payment.payment_time
                };
            }
        }
        res.status(200).json({
            success: true,
            data: {
                subscription: buildSubscriptionResponse(subscription, paymentDetails),
                payment: paymentDetails
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Get payment status failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            subscriptionId: req.params.subscriptionId,
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({ success: false, error: { message: 'Failed to get payment status' }, timestamp: new Date().toISOString() });
    }
};
exports.getPaymentStatus = getPaymentStatus;
const cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId, reason } = req.body;
        const user = await getUserByRequest(req);
        if (user == null) {
            res.status(401).json({ success: false, error: { message: 'Authentication required' }, timestamp: new Date().toISOString() });
            return;
        }
        const subscription = await Subscription_1.Subscription.findOne({ _id: subscriptionId, userId: user._id });
        if (subscription == null) {
            res.status(404).json({ success: false, error: { message: 'Subscription not found' }, timestamp: new Date().toISOString() });
            return;
        }
        if (subscription.status === 'cancelled') {
            res.status(400).json({ success: false, error: { message: 'Subscription is already cancelled' }, timestamp: new Date().toISOString() });
            return;
        }
        if (subscription.status === 'expired') {
            res.status(400).json({ success: false, error: { message: 'Cannot cancel expired subscription' }, timestamp: new Date().toISOString() });
            return;
        }
        subscription.status = 'cancelled';
        subscription.paymentStatus = 'CANCELLED';
        subscription.updatedAt = new Date();
        subscription.cancellationDate = new Date();
        subscription.cancellationReason = reason || 'Cancelled by user';
        await subscription.save();
        await User_1.User.findByIdAndUpdate(user._id, { subscriptionStatus: 'inactive' });
        logger_1.logger.info('Subscription cancelled', {
            userId: user._id,
            subscriptionId,
            plan: subscription.plan,
            reason: reason || 'No reason provided',
            ip: req.ip
        });
        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully',
            data: {
                subscription: {
                    id: subscription._id,
                    plan: subscription.plan,
                    status: subscription.status,
                    cancelledAt: subscription.updatedAt,
                    reason: reason || 'No reason provided'
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Cancel subscription failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            subscriptionId: req.body.subscriptionId,
            userId: req.user?.id,
            ip: req.ip
        });
        res.status(500).json({ success: false, error: { message: 'Failed to cancel subscription' }, timestamp: new Date().toISOString() });
    }
};
exports.cancelSubscription = cancelSubscription;
//# sourceMappingURL=paymentController.js.map