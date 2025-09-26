4. Backend Features & Requirements ⚙️
This section details the necessary backend functionality.

4.1. Subscription and Payments
The system must handle two distinct, recurring subscription plans.

Requirement 1.1: Payment Gateway Integration

Integrate with a payment provider (e.g., Razorpay, Stripe) to process recurring monthly payments for the ₹49 (Basic) and ₹99 (Premium) plans.

Requirement 1.2: Subscription Data Model

Create a subscriptions table in the database.

Schema: subscription_id (PK), user_id (FK), plan_id (e.g., 'basic', 'premium'), start_date, next_billing_date, status (ENUM: 'active', 'cancelled', 'payment_failed').

Requirement 1.3: Webhook for Payment Events

Implement a secure webhook endpoint to listen for events from the payment gateway.

On a payment.success event, the system must update the user's subscription status to 'active' and set the next_billing_date.

On a payment.failed event, update the status to 'payment_failed' and trigger a notification to the user.

4.2. User Authentication & Access Control
The system must manage user access based on their subscription tier.

Requirement 2.1: Automated User Provisioning

Upon a successful initial subscription payment, automatically create an entry in the users table.

Generate a secure, random password.

Requirement 2.2: Welcome Email

Integrate with an email service (e.g., AWS SES, SendGrid).

Trigger a transactional welcome email to the user containing their username (email) and the generated password.

Requirement 2.3: Role-Based Access Control (RBAC)

The users table should be linked to the subscriptions table. The user's access level (basic or premium) must be easily retrievable upon authentication.

Requirement 2.4: Secure Login Endpoint

The login API endpoint (POST /auth/login) must verify credentials and check the user's subscription status.

If status is not 'active', the login attempt must fail with an appropriate error message (e.g., "Subscription inactive").

4.3. Premium Content Delivery (Resume Templates)
The core value of the premium plan is access to exclusive content.

Requirement 3.1: Resume Template Data Model

Create a resume_templates table in the database.

Schema: template_id (PK), template_name, description, thumbnail_url, file_url, access_tier (ENUM: 'basic', 'premium').

Requirement 3.2: Content API Endpoint

Create a protected API endpoint (e.g., GET /api/v1/resumes).

This endpoint must check the authenticated user's access level.

If the user's plan is 'basic', the API returns only templates where access_tier = 'basic'.

If the user's plan is 'premium', the API returns all templates (access_tier = 'basic' AND 'premium').

4.4. Profile Management & Job Matching
The core job matching functionality remains the same for all active users, but it must only consider valid subscribers.

Requirement 4.1: Mandatory Profile Setup

The profiles table (linked to users) must store all user-provided academic and professional details.

Implement a flag, is_profile_complete, which is set to true only after all mandatory fields are saved.

Requirement 4.2: Job Matching Algorithm Enhancement

The job matching script/service must only query for users who meet both of the following conditions:

profiles.is_profile_complete = true

subscriptions.status = 'active'

The rest of the matching logic (filtering by qualification, stream, CGPA, etc.) will then be applied to this pre-filtered set of valid users. The user's plan tier ('basic' vs. 'premium') does not affect eligibility for a job match.