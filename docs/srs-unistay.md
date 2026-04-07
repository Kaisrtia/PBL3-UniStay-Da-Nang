# UniStay System Architecture & Core Logic Summary

## 1. Project Overview
UniStay is a specialized web application tailored for students in Da Nang, focusing on two main domains: **Accommodation Search** and **Roommate Matching**. The system integrates an **AI Bot** to actively detect scam signs and filter offensive language during the post-creation phase. The ultimate goal is to build a safe, transparent, and modern rental ecosystem for both students and hosts.

## 2. Actor Hierarchy & Roles

* **Guest**: Unauthenticated user. Can search public listings, use filters, and register/login.
* **User**: Authenticated entity (inherits from Guest). Can create posts (initially in `Pending` state), manage personal posts, reply to comments, and send system feedback.
* **Student** (Inherits User): Can manage a wishlist, create a Demand Form (UC-010) for finding roommates, and receive matching recommendations.
* **Host / Broker** (Inherits User): Manages rental listings and post statistics. Can earn a "Verified Badge" (Blue Tick) if they maintain a rating ≥ 4.5 and have ≥ 15 reviews.
* **Admin**: High-level system manager. Manually reviews AI-flagged posts, handles violation reports, verifies Hosts, and manages system-wide statistics.
* **AI Bot** (External Service API): Scans text and images to detect scams/offensive language and executes the Matching Score algorithm.

## 3. Core Functional Modules

### A. Post Management
* **Creation Flow**: User inputs data -> Saved as `Pending` -> Sent to AI for moderation.
* **Moderation Results**: `Approved` (Public), `Rejected` (with reasons), or forwarded to `Admin` for manual review if ambiguous.
* **Notifications**: Automated SMTP email alerts to notify users of approval status or prompt updates.

### B. Search & Interaction
* **Search Engine**: Full-text search (targeting ElasticSearch) optimized for keywords (street name, area).
* **Smart Filters**: By price range, location (District/Ward), property type, amenities, and distance to Da Nang universities.
* **Side-by-side Comparison**: UI Pop-up to hold and compare a maximum of 2 properties simultaneously based on technical specs.

### C. Roommate Matching
* **Data Structure**: Matches Student Profile against the Roommate Demand Form (UC-010).
* **Algorithm**: Calculates compatibility based on lifestyle habits (curfew, smoking, pets) and financial criteria.
* **Connection**: Sends a match request via email. If accepted by the recipient, the system provides Zalo contact links.

### D. Admin & Statistics
* **Host Verification**: Grants the "Blue Tick" based on metric thresholds.
* **Violation Reports**: Handled using `PostID`, `CommentID`, and image evidence.
* **Dashboard**: Visualizes rental density by area, CCU fluctuations, and successful post rates.

## 4. Technical Architecture & Stack
* **Architecture Pattern**: Client-Server model communicating via RESTful APIs.
* **Front-end (SPA)**: ReactJS, TypeScript, Vite. Uses React Router for navigation and Lazy Loading for image-heavy lists to optimize performance.
* **Back-end**: ASP.NET Core Web API, adhering to Clean Architecture and SOLID principles.
* **Third-party Services**:
    * **Storage**: Cloudinary / S3 (Image storage & optimization).
    * **Mapping**: Google Maps API (Coordinates and interactive maps).
    * **Authentication**: JWT for Role-Based Access Control (RBAC).
    * **Mailing**: SMTP Service (Match alerts, approval status).

## 5. Critical Business Logic

### Content Moderation Workflow
1.  **Pending State**: New or updated posts are placed in a queue.
2.  **AI Scanning**: Checks for offensive keywords and scam anomalies (e.g., suspiciously low prices, fake images).
3.  **Final State**: `Approved` (displays publicly and alerts matching students) or `Rejected` (notifies the user to edit).

### Roommate Matching Logic
* **Criteria**: Strict matching on Gender (mandatory). Soft matching on Schedule, Budget, and Lifestyle.
* **Threshold**: The system only recommends the Top 10 candidates who achieve a compatibility score of **≥ 70%**.
* **Data Integrity**: Ensures strict consistency between the `Demand ID` and the algorithm's returned results.

## 6. Implementation Guidelines (For AI/Developers)
* **Entity Management**: All data flows must attach standard identifiers (`PostID`, `UserID`, `CommentID`, `DemandID`).
* **Post Lifecycle**: Strictly control state transitions: `Pending` -> `Approved`/`Rejected` -> `Updated`/`Hidden`/`Deleted`.
* **Event Triggers**: Set up background workers to handle automated emails immediately upon events (e.g., UC-011 successful roommate request).
* **Strict RBAC**: Execution of specific Use Cases must be validated against the JWT Token Role (e.g., Only Admin tokens can access the Host Verification module).