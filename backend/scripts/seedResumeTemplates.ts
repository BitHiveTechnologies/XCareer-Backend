import { connectDB } from '../src/config/database';
import ResumeTemplate from '../src/models/ResumeTemplate';
import { User } from '../src/models/User';

async function seedResumeTemplates() {
  try {
    await connectDB();
    console.log('✅ Database connected');

    // Get admin user for createdBy field
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }

    // Clear existing templates
    await ResumeTemplate.deleteMany({});
    console.log('🗑️  Cleared existing resume templates');

    // Sample resume templates
    const templates = [
      {
        name: 'Professional Classic',
        description: 'A clean, professional resume template perfect for corporate environments',
        category: 'professional',
        industry: ['technology', 'finance', 'consulting'],
        experienceLevel: 'mid',
        templateData: {
          sections: [
            {
              id: 'header',
              name: 'Header',
              type: 'header',
              required: true,
              order: 1,
              fields: [
                { id: 'name', name: 'Full Name', type: 'text', required: true },
                { id: 'email', name: 'Email', type: 'email', required: true },
                { id: 'phone', name: 'Phone', type: 'phone', required: true },
                { id: 'location', name: 'Location', type: 'text', required: true }
              ]
            },
            {
              id: 'summary',
              name: 'Professional Summary',
              type: 'summary',
              required: true,
              order: 2,
              fields: [
                { id: 'summary', name: 'Summary', type: 'textarea', required: true, validation: { maxLength: 500 } }
              ]
            },
            {
              id: 'experience',
              name: 'Work Experience',
              type: 'experience',
              required: true,
              order: 3,
              fields: [
                { id: 'company', name: 'Company', type: 'text', required: true },
                { id: 'position', name: 'Position', type: 'text', required: true },
                { id: 'startDate', name: 'Start Date', type: 'date', required: true },
                { id: 'endDate', name: 'End Date', type: 'date', required: false },
                { id: 'description', name: 'Description', type: 'textarea', required: true }
              ]
            },
            {
              id: 'education',
              name: 'Education',
              type: 'education',
              required: true,
              order: 4,
              fields: [
                { id: 'institution', name: 'Institution', type: 'text', required: true },
                { id: 'degree', name: 'Degree', type: 'text', required: true },
                { id: 'graduationDate', name: 'Graduation Date', type: 'date', required: true },
                { id: 'gpa', name: 'GPA', type: 'text', required: false }
              ]
            },
            {
              id: 'skills',
              name: 'Skills',
              type: 'skills',
              required: true,
              order: 5,
              fields: [
                { id: 'skills', name: 'Skills', type: 'list', required: true }
              ]
            }
          ],
          styling: {
            fontFamily: 'Arial',
            fontSize: 12,
            colorScheme: 'professional',
            layout: 'single-column'
          },
          preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        subscriptionTier: 'basic',
        isActive: true,
        isPopular: true,
        downloadCount: 150,
        rating: 4.5,
        tags: ['professional', 'corporate', 'clean'],
        createdBy: adminUser._id
      },
      {
        name: 'Creative Modern',
        description: 'A modern, visually appealing resume template for creative professionals',
        category: 'creative',
        industry: ['design', 'marketing', 'media'],
        experienceLevel: 'entry',
        templateData: {
          sections: [
            {
              id: 'header',
              name: 'Header',
              type: 'header',
              required: true,
              order: 1,
              fields: [
                { id: 'name', name: 'Full Name', type: 'text', required: true },
                { id: 'email', name: 'Email', type: 'email', required: true },
                { id: 'phone', name: 'Phone', type: 'phone', required: true },
                { id: 'portfolio', name: 'Portfolio URL', type: 'url', required: false }
              ]
            },
            {
              id: 'summary',
              name: 'About Me',
              type: 'summary',
              required: true,
              order: 2,
              fields: [
                { id: 'summary', name: 'About Me', type: 'textarea', required: true, validation: { maxLength: 300 } }
              ]
            },
            {
              id: 'projects',
              name: 'Projects',
              type: 'projects',
              required: true,
              order: 3,
              fields: [
                { id: 'projectName', name: 'Project Name', type: 'text', required: true },
                { id: 'description', name: 'Description', type: 'textarea', required: true },
                { id: 'technologies', name: 'Technologies', type: 'list', required: true },
                { id: 'url', name: 'Project URL', type: 'url', required: false }
              ]
            },
            {
              id: 'skills',
              name: 'Skills',
              type: 'skills',
              required: true,
              order: 4,
              fields: [
                { id: 'skills', name: 'Skills', type: 'list', required: true }
              ]
            }
          ],
          styling: {
            fontFamily: 'Helvetica',
            fontSize: 11,
            colorScheme: 'modern',
            layout: 'two-column'
          },
          preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        subscriptionTier: 'premium',
        isActive: true,
        isPopular: true,
        downloadCount: 89,
        rating: 4.2,
        tags: ['creative', 'modern', 'design'],
        createdBy: adminUser._id
      },
      {
        name: 'Executive Leadership',
        description: 'An executive-level resume template for senior leadership positions',
        category: 'executive',
        industry: ['technology', 'finance', 'consulting', 'healthcare'],
        experienceLevel: 'executive',
        templateData: {
          sections: [
            {
              id: 'header',
              name: 'Header',
              type: 'header',
              required: true,
              order: 1,
              fields: [
                { id: 'name', name: 'Full Name', type: 'text', required: true },
                { id: 'title', name: 'Professional Title', type: 'text', required: true },
                { id: 'email', name: 'Email', type: 'email', required: true },
                { id: 'phone', name: 'Phone', type: 'phone', required: true },
                { id: 'linkedin', name: 'LinkedIn URL', type: 'url', required: false }
              ]
            },
            {
              id: 'summary',
              name: 'Executive Summary',
              type: 'summary',
              required: true,
              order: 2,
              fields: [
                { id: 'summary', name: 'Executive Summary', type: 'textarea', required: true, validation: { maxLength: 800 } }
              ]
            },
            {
              id: 'experience',
              name: 'Executive Experience',
              type: 'experience',
              required: true,
              order: 3,
              fields: [
                { id: 'company', name: 'Company', type: 'text', required: true },
                { id: 'position', name: 'Position', type: 'text', required: true },
                { id: 'startDate', name: 'Start Date', type: 'date', required: true },
                { id: 'endDate', name: 'End Date', type: 'date', required: false },
                { id: 'achievements', name: 'Key Achievements', type: 'textarea', required: true },
                { id: 'revenue', name: 'Revenue Impact', type: 'text', required: false }
              ]
            },
            {
              id: 'achievements',
              name: 'Key Achievements',
              type: 'achievements',
              required: true,
              order: 4,
              fields: [
                { id: 'achievement', name: 'Achievement', type: 'text', required: true },
                { id: 'impact', name: 'Impact', type: 'textarea', required: true }
              ]
            },
            {
              id: 'education',
              name: 'Education',
              type: 'education',
              required: true,
              order: 5,
              fields: [
                { id: 'institution', name: 'Institution', type: 'text', required: true },
                { id: 'degree', name: 'Degree', type: 'text', required: true },
                { id: 'graduationDate', name: 'Graduation Date', type: 'date', required: true }
              ]
            }
          ],
          styling: {
            fontFamily: 'Times New Roman',
            fontSize: 11,
            colorScheme: 'executive',
            layout: 'single-column'
          },
          preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        subscriptionTier: 'enterprise',
        isActive: true,
        isPopular: false,
        downloadCount: 23,
        rating: 4.8,
        tags: ['executive', 'leadership', 'senior'],
        createdBy: adminUser._id
      },
      {
        name: 'Technical Specialist',
        description: 'A technical resume template for software engineers and technical specialists',
        category: 'technical',
        industry: ['technology', 'software', 'engineering'],
        experienceLevel: 'senior',
        templateData: {
          sections: [
            {
              id: 'header',
              name: 'Header',
              type: 'header',
              required: true,
              order: 1,
              fields: [
                { id: 'name', name: 'Full Name', type: 'text', required: true },
                { id: 'title', name: 'Technical Title', type: 'text', required: true },
                { id: 'email', name: 'Email', type: 'email', required: true },
                { id: 'phone', name: 'Phone', type: 'phone', required: true },
                { id: 'github', name: 'GitHub URL', type: 'url', required: false }
              ]
            },
            {
              id: 'summary',
              name: 'Technical Summary',
              type: 'summary',
              required: true,
              order: 2,
              fields: [
                { id: 'summary', name: 'Technical Summary', type: 'textarea', required: true, validation: { maxLength: 600 } }
              ]
            },
            {
              id: 'experience',
              name: 'Technical Experience',
              type: 'experience',
              required: true,
              order: 3,
              fields: [
                { id: 'company', name: 'Company', type: 'text', required: true },
                { id: 'position', name: 'Position', type: 'text', required: true },
                { id: 'startDate', name: 'Start Date', type: 'date', required: true },
                { id: 'endDate', name: 'End Date', type: 'date', required: false },
                { id: 'technologies', name: 'Technologies Used', type: 'list', required: true },
                { id: 'description', name: 'Technical Description', type: 'textarea', required: true }
              ]
            },
            {
              id: 'projects',
              name: 'Technical Projects',
              type: 'projects',
              required: true,
              order: 4,
              fields: [
                { id: 'projectName', name: 'Project Name', type: 'text', required: true },
                { id: 'description', name: 'Description', type: 'textarea', required: true },
                { id: 'technologies', name: 'Technologies', type: 'list', required: true },
                { id: 'url', name: 'Project URL', type: 'url', required: false }
              ]
            },
            {
              id: 'skills',
              name: 'Technical Skills',
              type: 'skills',
              required: true,
              order: 5,
              fields: [
                { id: 'programming', name: 'Programming Languages', type: 'list', required: true },
                { id: 'frameworks', name: 'Frameworks & Libraries', type: 'list', required: true },
                { id: 'tools', name: 'Tools & Technologies', type: 'list', required: true }
              ]
            },
            {
              id: 'certifications',
              name: 'Certifications',
              type: 'certifications',
              required: false,
              order: 6,
              fields: [
                { id: 'certification', name: 'Certification', type: 'text', required: true },
                { id: 'issuer', name: 'Issuer', type: 'text', required: true },
                { id: 'date', name: 'Date', type: 'date', required: true }
              ]
            }
          ],
          styling: {
            fontFamily: 'Courier New',
            fontSize: 10,
            colorScheme: 'technical',
            layout: 'two-column'
          },
          preview: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        },
        subscriptionTier: 'premium',
        isActive: true,
        isPopular: true,
        downloadCount: 67,
        rating: 4.3,
        tags: ['technical', 'engineering', 'software'],
        createdBy: adminUser._id
      }
    ];

    // Insert templates
    const createdTemplates = await ResumeTemplate.insertMany(templates);
    console.log(`✅ Created ${createdTemplates.length} resume templates`);

    // Display created templates
    createdTemplates.forEach(template => {
      console.log(`   - ${template.name} (${template.category}, ${template.subscriptionTier})`);
    });

    console.log('\n🎉 Resume template seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Resume template seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedResumeTemplates();
