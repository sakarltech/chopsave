# Requirements Document

## Introduction

ChopSave is a food waste reduction marketplace for the Nigerian market, connecting food businesses (restaurants, bakeries, canteens, food stalls, supermarkets, and cloud kitchens) with nearby consumers. Businesses list surplus or unsold food at 50–75% discount; consumers discover, reserve, and pre-pay for these listings via GPS-based proximity search. Pickup is the only fulfillment method for MVP. The platform operates in Lagos and Abuja, supports Nigerian payment methods (Paystack, Flutterwave, bank transfer, USSD, OPay), and earns a 15–20% commission per transaction built invisibly into pricing.

The app is a single mobile (iOS + Android) and web application with role-based access: Consumer and Business/Partner.

---

## Glossary

- **ChopSave**: The platform — the mobile and web application described in this document.
- **Consumer**: A registered user who browses listings, reserves food, and collects pickups.
- **Business**: A registered food vendor (restaurant, bakery, canteen, food stall, supermarket, or cloud kitchen) that creates listings and fulfills pickups.
- **Listing**: A food item or bundle made available by a Business for discounted purchase. Listings are of two types: Surprise Bag or Itemised Listing.
- **Surprise_Bag**: A listing type where the Business defines a mystery bundle of surplus food at a set price; exact contents are not disclosed to the Consumer.
- **Itemised_Listing**: A listing type where the Business specifies named dishes or food items, quantities, original price, and discount price.
- **Pickup_Window**: A time range defined by the Business during which the Consumer must collect a reserved Listing.
- **Reservation**: A confirmed, pre-paid booking made by a Consumer for a specific Listing quantity.
- **Pickup_Code**: A unique alphanumeric code or QR code generated per Reservation, presented by the Consumer at collection.
- **Commission**: The platform fee of 15–20% of the Listing sale price, deducted from Business earnings before payout.
- **Payout**: The net earnings transferred to a Business's registered Nigerian bank account after Commission deduction.
- **OTP**: A one-time password sent via SMS to a Consumer's or Business's phone number for authentication.
- **CAC_Number**: Corporate Affairs Commission registration number used to verify Business legitimacy.
- **NGN**: Nigerian Naira — the currency used throughout ChopSave.
- **GPS_Location**: The device-reported geographic coordinates (latitude/longitude) used for proximity-based discovery.
- **Geofence**: The geographic boundary (Lagos or Abuja) within which ChopSave MVP operates.
- **No_Show**: A Reservation where the Consumer fails to collect within the Pickup_Window.
- **Payment_Gateway**: Paystack or Flutterwave, the integrated payment processors supporting card, bank transfer, USSD, and mobile wallet payments.
- **Admin**: A ChopSave internal operator with access to the administration dashboard for verification, moderation, and analytics.
- **Rating**: A 1–5 star score with optional text review, exchanged between Consumer and Business after a completed pickup.
- **Dashboard**: The Business-facing interface showing active listings, sales statistics, waste-saved metrics, and earnings.
- **Feed**: The Consumer-facing interface listing active, nearby Listings sorted by proximity and filtered by user preferences.
- **Waste_Saved_Metric**: A calculated value in kilograms estimating the food waste avoided through completed Reservations.

---

## Requirements

---

### Requirement 1: Phone-Based Consumer Registration and Authentication

**User Story:** As a Consumer, I want to register and log in using my phone number and OTP, so that I can access ChopSave without needing a password.

#### Acceptance Criteria

1. THE ChopSave_App SHALL collect a Consumer's phone number (in Nigerian format, e.g. 08XXXXXXXXX or +234XXXXXXXXX) and full name during registration.
2. WHEN a Consumer submits a phone number for registration or login, THE ChopSave_App SHALL send an OTP to that number via SMS within 30 seconds.
3. WHEN a Consumer enters the correct OTP within 5 minutes of dispatch, THE ChopSave_App SHALL create or authenticate the Consumer account and issue a session token.
4. IF a Consumer enters an incorrect OTP, THEN THE ChopSave_App SHALL display an error message and allow up to 3 retry attempts before locking the OTP for 10 minutes.
5. IF a Consumer does not receive the OTP within 60 seconds, THEN THE ChopSave_App SHALL allow the Consumer to request a resend.
6. WHEN a Consumer's session token expires after 30 days of inactivity, THE ChopSave_App SHALL require the Consumer to re-authenticate via OTP.
7. THE ChopSave_App SHALL store Consumer phone numbers in a normalised E.164 format (+234XXXXXXXXXX) regardless of input format.

---

### Requirement 2: Consumer Profile Management

**User Story:** As a Consumer, I want to manage my profile, so that I can keep my account details up to date.

#### Acceptance Criteria

1. THE ChopSave_App SHALL allow a Consumer to set and update a display name, profile photo, and dietary preferences (e.g. vegetarian, halal, no pork).
2. WHEN a Consumer updates their profile, THE ChopSave_App SHALL persist the changes and reflect them on the Consumer's profile page within 2 seconds.
3. THE ChopSave_App SHALL allow a Consumer to view their own ratings and review history.
4. THE ChopSave_App SHALL allow a Consumer to delete their account, which SHALL anonymise their personal data within 30 days in compliance with data retention policy.

---

### Requirement 3: GPS-Based Listing Discovery Feed

**User Story:** As a Consumer, I want to see food listings near my current location, so that I can find affordable food close to where I am.

#### Acceptance Criteria

1. WHEN a Consumer opens the Feed, THE ChopSave_App SHALL request GPS_Location permission from the device.
2. WHEN GPS_Location permission is granted, THE ChopSave_App SHALL display active Listings from Businesses within a default radius of 5 km, sorted by ascending distance.
3. WHEN GPS_Location permission is denied, THE ChopSave_App SHALL allow the Consumer to enter a Lagos or Abuja area manually to derive a search origin.
4. THE Feed SHALL display for each Listing: Business name, Listing type (Surprise Bag or Itemised), discounted price in NGN, original price in NGN (struck through), distance from Consumer, Pickup_Window, and available quantity.
5. WHEN no active Listings exist within the Consumer's search radius, THE ChopSave_App SHALL display a message indicating no listings are currently available nearby.
6. WHILE a Consumer is viewing the Feed, THE ChopSave_App SHALL refresh active Listings every 60 seconds to reflect new or expired Listings.
7. THE ChopSave_App SHALL restrict the Feed to Listings within the Lagos or Abuja Geofence only.

---

### Requirement 4: Listing Filters and Search

**User Story:** As a Consumer, I want to filter and search listings, so that I can quickly find food that suits my preferences and budget.

#### Acceptance Criteria

1. THE ChopSave_App SHALL provide filter options on the Feed for: maximum distance (1 km, 3 km, 5 km, 10 km), food category (local dishes, fast food, pastries, drinks, groceries, other), price range (NGN minimum and maximum), dietary tag (vegetarian, halal, vegan), and minimum Business rating.
2. WHEN a Consumer applies one or more filters, THE ChopSave_App SHALL update the Feed to show only Listings matching all selected filter criteria within 1 second.
3. THE ChopSave_App SHALL provide a text search field that filters Listings and Businesses by name, matching partial strings case-insensitively.
4. WHEN a Consumer clears all filters, THE ChopSave_App SHALL restore the default Feed view showing all active nearby Listings.

---

### Requirement 5: Map View of Nearby Businesses

**User Story:** As a Consumer, I want to see nearby food businesses on a map, so that I can visually identify which ones are closest to my route.

#### Acceptance Criteria

1. THE ChopSave_App SHALL provide a Map View tab that renders a map centred on the Consumer's GPS_Location with Business pins marking each Business that has active Listings.
2. WHEN a Consumer taps a Business pin on the Map View, THE ChopSave_App SHALL display a summary card showing the Business name, active Listing count, nearest Pickup_Window, and lowest discounted price in NGN.
3. WHEN a Consumer taps the summary card, THE ChopSave_App SHALL navigate to the Business profile page.
4. THE ChopSave_App SHALL update Business pins on the Map View whenever the Consumer's GPS_Location changes by more than 200 metres.

---

### Requirement 6: Listing Detail View

**User Story:** As a Consumer, I want to view the full details of a listing before I buy, so that I can make an informed purchase decision.

#### Acceptance Criteria

1. WHEN a Consumer selects a Listing from the Feed or Map View, THE ChopSave_App SHALL display the Listing detail page showing: Listing type, Business name and rating, food category, description, photo (if provided), discounted price in NGN, original price in NGN (struck through), Pickup_Window, remaining quantity, dietary tags, and Business address.
2. THE ChopSave_App SHALL display a "Reserve" button on the Listing detail page when remaining quantity is greater than zero and the Pickup_Window has not ended.
3. WHEN remaining quantity reaches zero or the Pickup_Window has ended, THE ChopSave_App SHALL replace the "Reserve" button with a "Sold Out" or "Expired" indicator respectively.

---

### Requirement 7: Reservation and Pre-Payment

**User Story:** As a Consumer, I want to reserve and pre-pay for a food listing, so that my order is secured before I travel to collect it.

#### Acceptance Criteria

1. WHEN a Consumer taps "Reserve" on a Listing, THE ChopSave_App SHALL present a quantity selector (minimum 1, maximum limited by remaining quantity) and a payment method selector.
2. THE ChopSave_App SHALL support the following payment methods via Payment_Gateway: debit/credit card, bank transfer, USSD, and OPay/mobile wallet.
3. WHEN a Consumer confirms a Reservation, THE ChopSave_App SHALL initiate the payment transaction via Payment_Gateway and hold the payment until the Reservation is confirmed.
4. WHEN payment is successfully authorised by Payment_Gateway, THE ChopSave_App SHALL create a Reservation record, decrement the Listing's available quantity by the reserved amount, and generate a unique Pickup_Code for the Reservation.
5. IF the payment transaction fails or is declined by Payment_Gateway, THEN THE ChopSave_App SHALL display a payment failure message and return the Consumer to the payment method selector without creating a Reservation.
6. WHEN a Reservation is created, THE ChopSave_App SHALL send a push notification and an SMS confirmation to the Consumer containing the Pickup_Code, Business name, address, and Pickup_Window.
7. THE ChopSave_App SHALL display all amounts to the Consumer in NGN only.
8. THE ChopSave_App SHALL complete the payment initiation step within 5 seconds of the Consumer confirming the Reservation.

---

### Requirement 8: Pickup Code Display and Order Management

**User Story:** As a Consumer, I want to view my active orders and present a pickup code at collection, so that I can collect my reserved food efficiently.

#### Acceptance Criteria

1. THE ChopSave_App SHALL provide an Orders screen listing all active Reservations and past orders for the Consumer, sorted by Pickup_Window ascending for active orders.
2. WHEN a Consumer taps an active Reservation, THE ChopSave_App SHALL display the Pickup_Code as both a QR code and a 6-character alphanumeric string on a full-screen card.
3. THE ChopSave_App SHALL display the Pickup_Code card without requiring an active internet connection, using locally cached Reservation data.
4. WHEN a Reservation's Pickup_Window ends without the Business marking it as completed, THE ChopSave_App SHALL update the Reservation status to No_Show and move it to order history.
5. THE ChopSave_App SHALL display the Consumer's full order history with Reservation status (Completed, No_Show, or Cancelled) and the amount paid in NGN.

---

### Requirement 9: No-Show and Cancellation Policy

**User Story:** As a Consumer, I want to understand the cancellation and no-show policy, so that I know what happens if I cannot collect my order.

#### Acceptance Criteria

1. THE ChopSave_App SHALL display the no-show policy to the Consumer before they confirm a Reservation: payment is forfeited if the Consumer does not collect within the Pickup_Window.
2. WHEN a Consumer cancels a Reservation more than 1 hour before the Pickup_Window starts, THE ChopSave_App SHALL initiate a full refund via Payment_Gateway within 24 hours.
3. IF a Consumer cancels a Reservation less than 1 hour before the Pickup_Window starts, THEN THE ChopSave_App SHALL not issue a refund and SHALL update the Reservation status to Cancelled (No Refund).
4. WHEN a Reservation is marked as No_Show, THE ChopSave_App SHALL record the No_Show against the Consumer's account.
5. WHEN a Consumer accumulates 3 or more No_Show records within a 30-day rolling period, THE ChopSave_App SHALL restrict the Consumer from making new Reservations for 7 days.

---

### Requirement 10: Consumer Ratings and Reviews

**User Story:** As a Consumer, I want to rate a business after pickup, so that I can share my experience with other consumers.

#### Acceptance Criteria

1. WHEN a Reservation is marked as Completed by the Business, THE ChopSave_App SHALL send the Consumer a prompt to rate the Business within 24 hours.
2. THE ChopSave_App SHALL allow the Consumer to submit a Rating of 1–5 stars and an optional text review of up to 300 characters for the Business.
3. THE ChopSave_App SHALL allow a Consumer to submit exactly one Rating per completed Reservation.
4. WHEN a Consumer submits a Rating, THE ChopSave_App SHALL update the Business's aggregate star rating (arithmetic mean of all Ratings) and display the updated rating on the Business profile within 5 minutes.
5. THE ChopSave_App SHALL display the 10 most recent reviews on each Business profile page, sorted by submission date descending.

---

### Requirement 11: Favourites and Saved Businesses

**User Story:** As a Consumer, I want to save my favourite businesses, so that I can quickly check for their new listings.

#### Acceptance Criteria

1. THE ChopSave_App SHALL allow a Consumer to add or remove a Business from their Favourites list from the Business profile page or Feed card.
2. THE ChopSave_App SHALL provide a Favourites screen listing all saved Businesses with their current active Listing count and next Pickup_Window.
3. WHEN a Business on a Consumer's Favourites list creates a new Listing, THE ChopSave_App SHALL send the Consumer a push notification within 5 minutes of the Listing being published.

---

### Requirement 12: Consumer Push Notifications

**User Story:** As a Consumer, I want to receive timely notifications, so that I don't miss new listings nearby or forget my upcoming pickups.

#### Acceptance Criteria

1. THE ChopSave_App SHALL send a Consumer a push notification when a new Listing is published within their default search radius or from a Favourited Business.
2. THE ChopSave_App SHALL send a Consumer a push notification 30 minutes before the start of their Pickup_Window as a pickup reminder.
3. THE ChopSave_App SHALL send a Consumer a push notification when the Business marks their order as "Ready for Pickup".
4. THE ChopSave_App SHALL allow a Consumer to configure notification preferences, including enabling or disabling each notification type.
5. IF a Consumer has disabled push notifications on their device, THEN THE ChopSave_App SHALL fall back to SMS notifications for order status updates (Ready for Pickup and Reservation Confirmed).

---

### Requirement 13: Business Registration and Verification

**User Story:** As a Business owner, I want to register my food business on ChopSave and get verified, so that I can start listing surplus food for sale.

#### Acceptance Criteria

1. THE ChopSave_App SHALL collect the following information during Business registration: business name, business type (restaurant, bakery, canteen, food stall, supermarket, or cloud kitchen), CAC_Number, business address (with Lagos or Abuja city selection), contact phone number, owner full name, and bank account details for payouts.
2. WHEN a Business submits the registration form, THE ChopSave_App SHALL validate that the CAC_Number field is non-empty and conforms to a 7-digit numeric format.
3. WHEN a Business registration is submitted, THE ChopSave_App SHALL create a Business account in "Pending Verification" status and notify the Admin for review.
4. WHEN the Admin approves a Business, THE ChopSave_App SHALL update the Business status to "Verified" and send the Business owner an SMS and push notification confirming approval.
5. IF the Admin rejects a Business registration, THEN THE ChopSave_App SHALL send the Business owner an SMS and push notification stating the rejection reason.
6. WHILE a Business is in "Pending Verification" status, THE ChopSave_App SHALL prevent the Business from creating Listings or appearing in the Consumer Feed.
7. THE ChopSave_App SHALL restrict Business registration to addresses within the Lagos or Abuja Geofence.

---

### Requirement 14: Business Dashboard

**User Story:** As a Business owner, I want a dashboard showing my performance metrics, so that I can track my sales, earnings, and environmental impact.

#### Acceptance Criteria

1. THE ChopSave_App SHALL provide a Business Dashboard displaying: number of active Listings, total Reservations today, total completed pickups (all time), total earnings in NGN (net of Commission), and Waste_Saved_Metric in kilograms.
2. THE Dashboard SHALL display a time-series chart of daily completed Reservations and earnings in NGN for the past 30 days.
3. THE ChopSave_App SHALL calculate the Waste_Saved_Metric as the sum of estimated food weight (in kilograms) of all completed Reservations, using a default weight of 0.5 kg per Listing unit where no explicit weight is provided.
4. WHEN a Business owner views the Dashboard, THE ChopSave_App SHALL refresh all metrics within 5 seconds of the page loading.

---

### Requirement 15: Create Surprise Bag Listing

**User Story:** As a Business owner, I want to create a Surprise Bag listing, so that I can sell surplus food as a mystery bundle without disclosing exact contents.

#### Acceptance Criteria

1. THE ChopSave_App SHALL allow a Verified Business to create a Surprise_Bag Listing by providing: price in NGN, available quantity (minimum 1), Pickup_Window (start time and end time on the same calendar day), food category, and an optional photo.
2. THE ChopSave_App SHALL validate that the Surprise_Bag discounted price is at most 50% of the Business-provided original estimated value in NGN.
3. WHEN a Business publishes a Surprise_Bag Listing, THE ChopSave_App SHALL make it visible in the Consumer Feed within 60 seconds.
4. THE ChopSave_App SHALL allow the Business to specify dietary tags (vegetarian, halal, vegan, contains pork, contains nuts) on the Surprise_Bag Listing.
5. THE ChopSave_App SHALL allow a Business to edit the quantity and Pickup_Window of a Surprise_Bag Listing after publication, provided no Reservations have been made against it.

---

### Requirement 16: Create Itemised Listing

**User Story:** As a Business owner, I want to create an itemised listing with specific dishes and prices, so that consumers know exactly what they are buying.

#### Acceptance Criteria

1. THE ChopSave_App SHALL allow a Verified Business to create an Itemised_Listing by providing: item name, description (up to 200 characters), original price in NGN, discounted price in NGN, available quantity (minimum 1), Pickup_Window (start time and end time on the same calendar day), food category, dietary tags, and an optional photo.
2. THE ChopSave_App SHALL validate that the discounted price on an Itemised_Listing is at most 50% of the original price in NGN.
3. WHEN a Business publishes an Itemised_Listing, THE ChopSave_App SHALL make it visible in the Consumer Feed within 60 seconds.
4. THE ChopSave_App SHALL allow a Business to edit the quantity, description, and Pickup_Window of an Itemised_Listing after publication, provided no Reservations have been made against it.
5. THE ChopSave_App SHALL allow a Business to delete an Itemised_Listing with zero Reservations; the Listing SHALL be removed from the Consumer Feed within 60 seconds of deletion.

---

### Requirement 17: Listing Lifecycle Management

**User Story:** As a Business owner, I want my listings to automatically expire at the end of the pickup window, so that consumers never see outdated listings.

#### Acceptance Criteria

1. WHEN a Listing's Pickup_Window end time is reached, THE ChopSave_App SHALL automatically change the Listing status to "Expired" and remove it from the Consumer Feed within 60 seconds.
2. WHEN a Listing's available quantity reaches zero, THE ChopSave_App SHALL automatically change the Listing status to "Sold Out" and remove it from the Consumer Feed within 60 seconds.
3. THE ChopSave_App SHALL retain Expired and Sold Out Listings in the Business's listing history for 90 days.
4. THE ChopSave_App SHALL allow a Business to manually close an active Listing, setting its status to "Closed"; closed Listings SHALL be removed from the Consumer Feed within 60 seconds.

---

### Requirement 18: Order Management for Businesses

**User Story:** As a Business owner, I want to view and manage incoming orders, so that I can prepare food and verify consumer pickups efficiently.

#### Acceptance Criteria

1. THE ChopSave_App SHALL provide a Business Orders screen listing all active Reservations for the current day, displaying: Consumer display name, Reservation time, Listing name, quantity reserved, Pickup_Code (last 4 characters visible), and Pickup_Window.
2. THE ChopSave_App SHALL allow a Business to mark an order as "Ready for Pickup", which SHALL trigger a push notification to the Consumer.
3. WHEN a Business scans or manually enters a Consumer's Pickup_Code, THE ChopSave_App SHALL validate the code against the active Reservation and, if valid, mark the Reservation as Completed.
4. IF a Business enters an invalid or already-used Pickup_Code, THEN THE ChopSave_App SHALL display an error message indicating the code is invalid or already redeemed.
5. WHEN a Reservation is marked as Completed, THE ChopSave_App SHALL add the net earnings (sale price minus Commission) to the Business's pending Payout balance.
6. THE ChopSave_App SHALL send the Business a push notification within 60 seconds of a new Reservation being created for any of its active Listings.

---

### Requirement 19: Business Rating of Consumers

**User Story:** As a Business owner, I want to rate consumers after pickup, so that I can flag no-shows and reward reliable buyers.

#### Acceptance Criteria

1. WHEN a Reservation is marked as Completed or No_Show, THE ChopSave_App SHALL allow the Business to submit a Rating of 1–5 stars for the Consumer within 24 hours of the Pickup_Window ending.
2. THE ChopSave_App SHALL allow the Business to optionally flag a Completed or No_Show Reservation with a reason tag (e.g. "No Show", "Rude Behaviour", "Excellent Customer").
3. THE ChopSave_App SHALL allow a Business to submit exactly one Rating per Reservation.
4. WHEN a Business submits a No_Show flag, THE ChopSave_App SHALL record it against the Consumer's No_Show count for the rolling 30-day period defined in Requirement 9.

---

### Requirement 20: Payout Management

**User Story:** As a Business owner, I want to withdraw my earnings to my Nigerian bank account, so that I receive payment for the food I sell.

#### Acceptance Criteria

1. THE ChopSave_App SHALL maintain a Payout balance for each Business, updated upon each Reservation being marked Completed, reflecting the sale price minus the Commission percentage.
2. THE ChopSave_App SHALL allow a Business to request a Payout of any amount from NGN 500 up to their available Payout balance to their registered Nigerian bank account.
3. WHEN a Payout is requested, THE ChopSave_App SHALL initiate the bank transfer via Payment_Gateway within 24 hours and update the Payout status to "Processing".
4. WHEN Payment_Gateway confirms the bank transfer, THE ChopSave_App SHALL update the Payout status to "Completed" and deduct the amount from the Business's Payout balance.
5. IF a Payout transfer fails, THEN THE ChopSave_App SHALL restore the amount to the Business's Payout balance and notify the Business with the failure reason.
6. THE ChopSave_App SHALL display a full Payout transaction history for the Business, showing amount in NGN, date, status, and destination bank account (last 4 digits only).

---

### Requirement 21: Commission Handling

**User Story:** As the platform, I want to automatically deduct a commission from each transaction, so that ChopSave generates revenue without requiring businesses or consumers to manually manage platform fees.

#### Acceptance Criteria

1. THE ChopSave_App SHALL apply a Commission of between 15% and 20% (inclusive) to each Reservation transaction, deducted from the amount remitted to the Business.
2. THE ChopSave_App SHALL present the Consumer with the full discounted Listing price in NGN; the Commission deduction SHALL NOT be displayed as a separate line item to the Consumer.
3. THE ChopSave_App SHALL record the Commission amount in NGN for each completed Reservation for Admin financial reporting.
4. THE ChopSave_App SHALL allow the Admin to configure the Commission percentage per Business tier between 15% and 20% inclusive.

---

### Requirement 22: Business Verification Workflow (Admin)

**User Story:** As an Admin, I want to review and approve or reject business registrations, so that only legitimate Nigerian food businesses can list on ChopSave.

#### Acceptance Criteria

1. THE ChopSave_App SHALL provide an Admin interface listing all Business registrations in "Pending Verification" status, sorted by submission date ascending.
2. THE ChopSave_App SHALL display the following for each pending Business in the Admin interface: business name, business type, CAC_Number, address, owner name, contact phone, submission date, and uploaded verification documents.
3. THE ChopSave_App SHALL allow the Admin to approve a Business registration, transitioning its status to "Verified".
4. THE ChopSave_App SHALL allow the Admin to reject a Business registration with a mandatory rejection reason (minimum 10 characters), transitioning its status to "Rejected".
5. WHEN the Admin approves or rejects a Business, THE ChopSave_App SHALL trigger the corresponding notifications defined in Requirement 13.

---

### Requirement 23: Admin Analytics Dashboard

**User Story:** As an Admin, I want an analytics dashboard, so that I can monitor platform health, transaction volumes, and environmental impact.

#### Acceptance Criteria

1. THE ChopSave_App SHALL provide an Admin Analytics Dashboard displaying: total registered Consumers, total Verified Businesses, total Reservations (all time), total completed pickups, total platform Commission earned in NGN, and total Waste_Saved_Metric across all Businesses.
2. THE ChopSave_App SHALL display platform-level time-series charts of daily Reservations and Commission earned in NGN for a selectable date range of up to 90 days.
3. THE ChopSave_App SHALL allow the Admin to filter the Analytics Dashboard by city (Lagos or Abuja).
4. THE ChopSave_App SHALL refresh Admin Analytics Dashboard data at most 15 minutes after any underlying metric changes.

---

### Requirement 24: Content Moderation

**User Story:** As an Admin, I want to review and remove inappropriate listings or reviews, so that the platform remains trustworthy and safe.

#### Acceptance Criteria

1. THE ChopSave_App SHALL allow a Consumer or Business to report a Listing, review, or Business profile as inappropriate, providing a mandatory reason category (misleading content, offensive content, food safety concern, other).
2. WHEN a report is submitted, THE ChopSave_App SHALL create a moderation ticket visible in the Admin interface within 5 minutes.
3. THE ChopSave_App SHALL allow the Admin to remove a reported Listing, review, or Business profile from public view.
4. WHEN the Admin removes a Listing with active Reservations, THE ChopSave_App SHALL cancel all active Reservations for that Listing and initiate full refunds to affected Consumers via Payment_Gateway within 24 hours.
5. THE ChopSave_App SHALL allow the Admin to suspend a Business account, which SHALL prevent the Business from creating new Listings and hide all existing active Listings from the Consumer Feed.

---

### Requirement 25: Dispute Resolution

**User Story:** As a Consumer or Business, I want to raise a dispute about an order, so that I can seek a resolution when something goes wrong.

#### Acceptance Criteria

1. THE ChopSave_App SHALL allow a Consumer to raise a dispute on a completed or No_Show Reservation within 24 hours of the Pickup_Window ending, providing a reason (food quality issue, food not available, incorrect order, other) and optional description up to 500 characters.
2. WHEN a dispute is submitted, THE ChopSave_App SHALL create a dispute ticket visible in the Admin interface within 5 minutes and notify both the Consumer and the Business.
3. THE ChopSave_App SHALL allow the Admin to resolve a dispute by issuing a full refund, partial refund, or no refund to the Consumer, with a mandatory resolution note.
4. WHEN the Admin issues a refund as part of a dispute resolution, THE ChopSave_App SHALL process the refund via Payment_Gateway within 24 hours and notify the Consumer of the resolution outcome.

---

### Requirement 26: USSD Payment Fallback

**User Story:** As a Consumer with limited data access, I want to pay using USSD, so that I can still reserve food when my mobile data is low or unavailable.

#### Acceptance Criteria

1. THE ChopSave_App SHALL present USSD as a payment method option in the payment method selector during the Reservation flow.
2. WHEN a Consumer selects USSD as payment method, THE ChopSave_App SHALL display the Payment_Gateway USSD shortcode and instructions for completing the payment on any Nigerian mobile network.
3. WHEN Payment_Gateway confirms USSD payment completion, THE ChopSave_App SHALL proceed with Reservation creation as defined in Requirement 7, Criterion 4.
4. IF the USSD payment session expires without completion (after 5 minutes), THEN THE ChopSave_App SHALL cancel the pending Reservation and display a message instructing the Consumer to retry.

---

### Requirement 27: Geofencing Enforcement

**User Story:** As the platform, I want to restrict listings and registrations to Lagos and Abuja, so that ChopSave operates exclusively within its MVP launch cities.

#### Acceptance Criteria

1. WHEN a Business submits a registration with an address outside the Lagos or Abuja Geofence, THE ChopSave_App SHALL reject the registration with a message stating the city is not yet supported.
2. WHEN a Consumer's GPS_Location is outside the Lagos and Abuja Geofence and no manual location within a supported city is set, THE ChopSave_App SHALL display a message indicating that ChopSave is not yet available in the Consumer's area.
3. THE ChopSave_App SHALL define the Lagos Geofence as a polygon encompassing Lagos State and the Abuja Geofence as a polygon encompassing the Federal Capital Territory (Abuja).

---

### Requirement 28: Nigerian Food Categories

**User Story:** As a Consumer and Business, I want food categories that reflect Nigerian food culture, so that listings are easy to browse and classify.

#### Acceptance Criteria

1. THE ChopSave_App SHALL support the following food categories for Listings: Local Dishes, Fast Food, Pastries & Baked Goods, Drinks & Beverages, Groceries & Produce, Continental, Snacks, and Other.
2. THE ChopSave_App SHALL allow a Business to assign exactly one primary food category and up to two secondary categories to each Listing.
3. THE ChopSave_App SHALL display food category icons or labels on Listing cards in the Consumer Feed.

---

### Requirement 29: Session Security and Data Protection

**User Story:** As a user of ChopSave, I want my personal data and payment information to be protected, so that I can use the platform with confidence.

#### Acceptance Criteria

1. THE ChopSave_App SHALL transmit all data between the client and server over HTTPS/TLS 1.2 or higher.
2. THE ChopSave_App SHALL never store full card numbers, CVVs, or bank account PINs on ChopSave servers; all payment instrument data SHALL be tokenised by Payment_Gateway.
3. THE ChopSave_App SHALL store Consumer and Business passwords (if any) using bcrypt or Argon2 hashing; phone-number OTP authentication does not require password storage.
4. THE ChopSave_App SHALL implement rate limiting on OTP requests to a maximum of 5 OTP requests per phone number per hour.
5. THE ChopSave_App SHALL log all authentication events (login, logout, failed OTP attempts) with timestamp, device type, and IP address for security audit purposes.
