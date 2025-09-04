---
title: Learn with Daily Mastery - From AI Generation to Email Delivery
slug: 2025-09-04-learn-with-daily-mastery-from-ai-generation-to-email-delivery
description: Discover how to build a high-performance lesson scheduling system that processes thousands of users daily, generates personalized AI content, and delivers beautiful email lessons at precisely the right time. Learn about architecture, scaling, and real-world performance metrics.
categories: ['nextjs', 'ai', 'gcp', 'fastify']
coverImage: https://dalenguyen.me/assets/images/blog/dailymastery-home.png
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2025-09-04T15:17:31.359Z
series: Learn with Daily Mastery
author: Dale Nguyen
---

One of the biggest challenges in online education isn't creating content—it's delivering the right content to the right person at the right time. When building [DailyMastery](https://dailymastery.io), we needed to solve a complex scheduling problem: how do you deliver personalized, AI-generated lessons to users across different time zones, preferences, and learning schedules?

Our solution is a high-performance lesson scheduling system that processes thousands of users daily, generates personalized content on-the-fly, and delivers beautiful email lessons at precisely the right moment. Here's how we built it.

<figure>
  <img src="assets/images/blog/dailymastery-email.png" alt="DailyMastery email" width="100%" height="auto" />
  <figcaption>DailyMastery email</figcaption>
</figure>

## The Challenge: Personalization at Scale

Traditional learning platforms send the same content to everyone. But true personalization requires:

- **Individual content generation**: Each lesson tailored to specific goals and progress
- **Time-based delivery**: Respecting user preferences for morning, afternoon, or evening learning
- **Scalable processing**: Handling growing user bases without performance degradation
- **Reliability**: Ensuring lessons are delivered consistently, even when individual components fail

## Architecture Overview: From User Preferences to Inbox

Our lesson scheduling system consists of several coordinated services:

### 1. User Selection Engine

The system starts by identifying which users should receive lessons for each time slot:

**Selection Criteria**:

- Users must have `preferences.studyTime` matching the time slot ('morning', 'afternoon', 'evening')
- Users must have `preferences.notifications.dailyReminders` enabled
- Users must have active study plans with lessons scheduled for today

**Time Slots**:

- 06:00 UTC (Morning): Targets users who prefer early learning
- 12:00 UTC (Afternoon): Catches lunch-break learners
- 18:00 UTC (Evening): Reaches after-work studiers

### 2. AI Content Generation Pipeline

Once we identify users, each lesson goes through our AI enhancement process:

**Process Flow**:

1. **Lesson Retrieval**: Get scheduled lesson from database with original template content
2. **AI Enhancement**: Use Google Cloud Vertex AI with Gemini to expand and personalize the content
3. **Quality Validation**: Ensure AI-generated content meets quality standards
4. **Fallback Strategy**: Use original template if AI generation fails

**Content Personalization**:
The AI considers user context including:

- Learning objectives and goals
- Current progress and difficulty level
- Preferred learning style and time commitment
- Previous lesson feedback and engagement

### 3. Batch Processing for Scale

To handle thousands of users efficiently, we use sophisticated batch processing:

**Concurrency Control**:

```typescript
const pLimit = (await import('p-limit')).default
const limit = pLimit(10) // Process up to 10 users concurrently

const promises = userGroups.map((userGroup) => limit(() => this.processUserGroup(userGroup)))

await Promise.allSettled(promises)
```

**Error Resilience**:
Individual user failures don't stop the entire batch. Each user's processing is isolated, logged, and reported separately.

## The Lesson Processor: Heart of the System

Our `LessonProcessorService` handles the complex task of managing lesson content:

### Active Plan Discovery

The system performs comprehensive scans to find all active study plans:

```typescript
async getActivePlans(): Promise<UserPlanGroup[]> {
  // Scan all users with active plans
  // Find today's scheduled lessons
  // Group by user for efficient processing
}
```

### AI Content Generation

Each lesson is enhanced with AI-generated content:

**Quality Metrics**:

- Content length and depth analysis
- Learning objective alignment
- Engagement potential scoring
- Readability assessment

**Performance Tracking**:

- AI generation time per lesson
- Success/failure rates
- Content quality improvement over time
- User engagement correlation

### Database Integration

Seamless integration with Firestore for lesson management:

- Atomic updates for lesson content
- Timestamp tracking for delivery status
- Progress tracking for user analytics
- Batch operations for efficiency

## Email Delivery: The Final Mile

Our `EmailCoordinatorService` handles the critical task of email delivery:

### Personalized Templates

Each email is personalized based on:

- **Time-based greetings**: 🌅 "Good morning" vs ☀️ "Good afternoon" vs 🌙 "Good evening"
- **Study plan context**: Extracted plan names and goals
- **Progress indicators**: Current lesson number and completion status
- **Engagement elements**: Interactive exercises and progress tracking

### Responsive Design

Our `TemplateEngineService` creates mobile-friendly emails with:

- Maximum width of 600px for optimal display
- Modern gradient designs and professional styling with CSS animations
- Clear call-to-action buttons for lesson engagement
- Progress visualization and success metrics
- Time-based personalized greetings and content adaptation
- Professional email templates with comprehensive fallback support

### Delivery Reliability

Email delivery includes comprehensive error handling:

- Detailed error logging for failed deliveries
- Retry mechanisms for transient failures
- Admin alerting for critical delivery issues
- Success rate monitoring and reporting
- Batch email API with intelligent fallback to individual sends
- Rate limiting protection (2 requests per second compliance)

## Real-Time Processing Flow

Here's what happens when our scheduler processes the morning time slot:

### 1. Trigger Processing (06:00 UTC)

```typescript
POST /schedule/06:00
```

### 2. User Discovery

- Query database for morning-preference users
- Filter for active daily reminders
- Identify today's scheduled lessons

### 3. Batch Processing

- Group users for efficient processing
- Apply concurrency limits (10 concurrent users)
- Process each user's lessons independently

### 4. Content Generation

For each user:

- Retrieve scheduled lessons from database
- Generate AI-enhanced content
- Update lesson records with new content
- Mark lessons as processed

### 5. Email Delivery

- Render personalized HTML templates
- Send via Resend email service
- Track delivery status and metrics
- Update lesson records with sent timestamps

### 6. Reporting and Monitoring

- Generate processing summary
- Send admin reports via email
- Log performance metrics
- Alert on critical errors

## Performance Metrics and Monitoring

Our system tracks comprehensive metrics:

### Processing Performance

- **Total processing time per time slot**
- **Average time per user**
- **Concurrency efficiency metrics**
- **Database operation latency**

### Content Quality

- **AI generation success rates** (target: >95%)
- **Content length and complexity metrics**
- **User engagement correlation with AI content**
- **Fallback usage rates**

### Email Delivery

- **Email send success rates** (target: >99%)
- **Template rendering performance**
- **User engagement rates** (opens, clicks, completions)
- **Bounce and complaint rates**

## Future Enhancements

We're continuously improving the scheduling system:

### Advanced Personalization

- **Learning pattern analysis**: Adapt timing based on user engagement patterns
- **Content difficulty adjustment**: Dynamic complexity scaling based on progress
- **Multi-modal delivery**: Support for SMS, push notifications, and in-app delivery

### Performance Optimization

- **Predictive scaling**: Auto-scaling based on user growth patterns
- **Content pre-generation**: Cache frequently used AI-generated content
- **Global distribution**: Multi-region deployment for reduced latency

### Analytics and Insights

- **Learning effectiveness metrics**: Correlation between delivery timing and retention
- **Content performance analysis**: A/B testing for AI-generated vs template content
- **User journey optimization**: Personalized scheduling based on individual success patterns

## Lessons Learned

Building a personalized lesson scheduling system taught us:

### Technical Insights

1. **Batch processing with concurrency limits** provides the best balance of speed and reliability
2. **Comprehensive error handling** at every level is essential for user trust
3. **AI content generation requires robust fallback strategies** for reliability
4. **Email delivery is more complex than it appears** - template rendering, personalization, and deliverability all matter

### Product Insights

1. **Time-based personalization significantly improves engagement** compared to generic scheduling
2. **AI-enhanced content shows measurably higher completion rates** than template-based lessons
3. **Processing transparency builds user confidence** - users appreciate knowing when their lessons are being prepared
4. **Reliable delivery is table stakes** - users expect lessons to arrive consistently

## Getting Started

If you're building your own personalized delivery system, consider:

1. **Start with reliable basics**: Get consistent delivery working before adding AI enhancement
2. **Design for failure**: Assume every external service will fail and plan accordingly
3. **Monitor everything**: Comprehensive logging and metrics are essential for debugging and optimization
4. **Test with real load**: Batch processing behaves differently at scale

Our lesson scheduling system demonstrates that personalized, AI-powered education delivery is not only possible but can be built reliably and efficiently with the right architecture and attention to detail.
