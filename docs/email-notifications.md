# Email Notification System

This document outlines the email notification system for map contributions in Bengaluru Townsquare.

## Overview

The system sends email notifications at three key points in the location submission workflow:

1. When a user submits a new location to a map (notifies the map owner)
2. When a map owner approves a location submission (notifies the submitter)
3. When a map owner rejects a location submission (notifies the submitter)

## Setup Requirements

To enable email notifications, you need to:

1. Create an account on [Resend](https://resend.com)
2. Add your API key to the `.env.local` file:
   ```
   RESEND_API_KEY=your-resend-api-key
   NEXT_PUBLIC_APP_URL=https://your-app-url.com
   ```

## How It Works

### Submission Notification

When a user submits a location to a map:

- If the submitter is not the map owner, an email is sent to the map owner
- The email contains details about the submission and a link to review it

### Approval Notification

When a map owner approves a location:

- An email is sent to the submitter
- The email confirms the approval and includes a link to view the location on the map

### Rejection Notification

When a map owner rejects a location:

- An email is sent to the submitter
- The email provides a gentle notification that their submission was not approved

## Email Templates

The email templates are defined in `lib/services/emailService.ts` and can be customized as needed.

## Error Handling

The system is designed to be fault-tolerant:

- Email sending errors are logged but don't prevent the main operations from completing
- If an email fails to send, the user experience is not affected

## Testing

To test the email notification system:

1. Set up your Resend API key in the `.env.local` file
2. Create a test map
3. Submit a location to the map using a different account
4. Approve or reject the submission
5. Check the email accounts for notifications
