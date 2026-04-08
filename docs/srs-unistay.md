# UNISTAY - AI Coding Summary

## 1. What this system is

**UNISTAY** is a web platform for **student housing discovery and roommate matching in Da Nang**.  
The system is not just a rental listing site. It combines:

- room rental listings,
- student demand profiles,
- roommate matching,
- community interaction (comments, feedback, reports),
- admin moderation,
- simple analytics.

The document positions UNISTAY as a **student-focused housing marketplace + matching platform**, with special emphasis on **finding compatible roommates**, **moderating untrusted content**, and **helping students search by university, area, budget, and lifestyle criteria**.

---

## 2. Main actors and role model

### Guest
Unauthenticated visitor.

Can:
- register,
- log in,
- search listings,
- compare listings,
- view listing details.

### User
Authenticated base role.

Can:
- do everything Guest can do,
- create/update posts,
- comment/reply,
- save favorite posts,
- send system feedback.

### Student
Specialized authenticated user focused on renting / finding roommates.

Can:
- create a housing demand profile,
- receive matched listings,
- request roommate/accommodation connections,
- manage favorites,
- evaluate hosts.

### Host
Specialized authenticated user who publishes listings.

Can:
- create/manage rental posts,
- monitor listing effectiveness,
- potentially gain verified/trusted status.

### Admin
System operator.

Can:
- process abuse reports,
- verify trusted hosts/brokers,
- review flagged content,
- view system statistics.

### AI Bot
External moderation service.

Used for:
- checking new/updated posts,
- detecting fraud/inappropriate content,
- supporting the moderation workflow.

### Role relationships
- `Guest -> User` after successful login.
- `Student` and `Host` inherit base `User` capabilities.
- `Admin` is operationally separate from normal end-user behavior.
- `AI Bot` is an external service, not a human user.

---

## 3. Functional decomposition

The document breaks the system into 5 feature groups.

### A. Listing management
- create listing,
- update listing,
- hide/delete listing,
- AI-assisted moderation.

### B. Listing discovery and interaction
- search/filter listings,
- view listing details,
- compare 2 listings,
- save favorite listings,
- comment/reply.

### C. Connection and demand
- create housing demand profile,
- receive matched listings,
- search/find roommate posts,
- send roommate/accommodation request,
- reveal contact channel after acceptance.

### D. User/admin management
- verify host/broker account,
- process abuse reports,
- receive system feedback.

### E. Statistics
- area-based housing statistics,
- post statistics,
- user statistics,
- traffic statistics.

---

## 4. Core domain concepts

The domain revolves around **users**, **posts**, **location**, **amenities**, **matching**, and **moderation**.

### Core business objects
- **User**: root account object.
- **Student**: user subtype for renters/roommate seekers.
- **Host**: user subtype for landlords/brokers.
- **Post**: listing for either renting or finding a roommate.
- **StudentDemand**: a student's saved demand profile/preferences.
- **AccommodationRequest**: a request from a student to a post / roommate opportunity.
- **Comment**: nested comments on posts.
- **Report**: abuse/moderation record.
- **Notification**: message sent to users when relevant events happen.
- **SystemFeedback**: bug report / complaint / product feedback.
- **Amenity**: Wi-Fi, AC, washing machine, etc.
- **Ward / District / University**: geographic and academic context for search/matching.

---

## 5. High-level system architecture

## Frontend
Documented as:
- **ReactJS + TypeScript**
- **Vite**
- **Axios**
- **React Router**

Frontend responsibilities:
- render SPA pages,
- collect form input,
- manage auth state and favorites,
- call backend APIs,
- show search results, details, comments, dashboards, and notifications.

## Backend
The document describes a layered REST backend:

- **Routes**
- **Controllers**
- **Services**
- **Data access / Models**
- **Middlewares**
- **Config**

Backend responsibilities:
- auth,
- business rules,
- moderation flow,
- search and filtering,
- matching logic,
- persistence,
- admin actions,
- analytics aggregation.

## Important architecture note
The document is **internally inconsistent** about the backend stack:

- one section says **ASP.NET Core Web API**,
- another section describes a backend built like **ExpressJS / NodeJS**.

For coding purposes, the stable takeaway is:

- the system is a **client-server SPA + REST JSON API**,
- the backend should be treated as a **layered web API**,
- the exact framework should be chosen and normalized before implementation.

---

## 6. End-to-end data flow

## 6.1 Registration and login
1. Guest opens auth screen.
2. Frontend submits registration/login form.
3. Backend validates fields.
4. Backend creates or authenticates `User`.
5. Backend establishes authenticated session/token state.
6. Frontend routes the user based on role.

Key persisted data:
- `user`
- email verification / phone verification flags
- role
- status

## 6.2 Listing creation and moderation
1. Authenticated `Student` or `Host` opens create-post form.
2. Frontend uploads images and submits listing data.
3. Backend stores a `Post` with status `PENDING`.
4. Backend sends text/images to AI moderation service.
5. AI returns approve/reject result.
6. Backend changes status:
   - `APPROVED` -> listing becomes searchable/public
   - `REJECTED` -> reason is saved
   - possibly manual admin review if needed
7. Backend emits notifications to relevant users.

Key persisted data:
- `post`
- `post_image`
- `post_amenity`
- moderation status / rejection reason
- notifications

## 6.3 Listing update flow
1. Post owner edits listing.
2. Backend revalidates changed content.
3. AI moderation runs again if needed.
4. Backend updates listing.
5. Status may move to `UPDATED` or back through moderation logic.
6. Public search results reflect new content.

## 6.4 Search -> detail -> compare flow
1. User supplies filters:
   - district/ward,
   - university proximity,
   - price range,
   - room type,
   - amenities,
   - other criteria.
2. Backend queries approved posts.
3. Frontend renders result list.
4. User may:
   - open details,
   - increment view count,
   - compare 2 posts,
   - save favorites,
   - comment.

Core search output:
- list of approved posts with enough summary data for cards and sorting.

## 6.5 Student demand and matching flow
1. Student creates/updates `StudentDemand`.
2. Backend stores desired:
   - area,
   - university,
   - price range,
   - room type,
   - roommate preference,
   - required amenities.
3. Backend loads candidate posts.
4. Matching logic computes compatibility scores.
5. Backend returns ranked matches.
6. Backend may notify student when a newly approved post matches saved demand.

This is one of the most important domain flows in the system.

## 6.6 Roommate / accommodation request flow
1. Student finds a suitable roommate/rental post.
2. Student sends request.
3. Backend stores `AccommodationRequest` with `PENDING`.
4. Host or post owner reviews requester profile.
5. Owner accepts or rejects.
6. If accepted:
   - request status becomes accepted,
   - contact channel (Zalo) is revealed,
   - interaction history is preserved.

Important business rule:
- direct contact is supposed to be hidden until the request is accepted.

## 6.7 Favorites and comments
### Favorites
- user toggles save/remove on a post,
- backend writes many-to-many mapping,
- favorite list page loads saved posts.

### Comments
- user writes comment on a post,
- backend stores `Comment`,
- replies are represented by `parent_id`,
- UI updates immediately,
- comment/report moderation may hide content.

## 6.8 Reporting and admin moderation
1. User reports post/comment/account.
2. Backend creates `Report`.
3. Admin reviews report details.
4. Admin can:
   - accept report,
   - reject report,
   - hide/delete post,
   - lock/ban account,
   - add moderation note.
5. Backend updates object status and audit fields.

## 6.9 Feedback and notifications
### System feedback
- user submits bug report / complaint / suggestion,
- backend stores `SystemFeedback`,
- admin/support views feedback queue.

### Notifications
System emits notifications for:
- post approved/rejected,
- new matching posts,
- new request received,
- request accepted/rejected,
- account verification changes.

## 6.10 Statistics flow
Admin selects time range / area filters.
Backend aggregates database records and logs into summary metrics:
- post counts,
- average prices,
- area distribution,
- user growth,
- traffic.

---

## 7. Data model summary

## 7.1 Main enums from the document
- `account_role`: `ADMIN`, `USER`, `STUDENT`, `HOST`
- `account_status`: `ACTIVE`, `LOCKED`, `BANNED`, `SET_UP`, `HIDDEN`
- `post_status`: `PENDING`, `APPROVED`, `REJECTED`, `UPDATED`, `HIDDEN`
- `comment_status`: `DISPLAYED`, `HIDDEN`
- `report_status`: `PENDING`, `RESOLVED`, `REJECTED`, `HIDDEN`
- request status enum exists, but naming is inconsistent in the document
- `room_type`: `ROOM`, `APARTMENT`, `HOUSE`
- `post_purpose`: `RENT`, `FIND_ROOMMATE`

---

## 7.2 Entity summaries

### `user`
Base identity/account record.

Important fields:
- `id`
- `email`
- `hashed_password`
- `phone`
- `full_name`
- `dob`
- `gender`
- `avatar_url`
- `status`
- `email_verified`
- `phone_verified`
- `role`
- `created_at`

### `host`
One-to-one extension of `user`.

Important fields:
- `host_id` (FK to `user.id`)
- `is_verified`
- `avg_star`

### `student`
One-to-one extension of `user`.

Important fields:
- `student_id` (FK to `user.id`)
- `total_posts`
- `university`

### `district`
Administrative district.

### `ward`
Belongs to a district.

### `university`
Belongs to a ward and anchors location-aware student search.

### `post`
Most important content entity.

Important fields:
- `id`
- `user_id`
- `ward_id`
- `title`
- `purpose`
- `detail_address`
- `room_type`
- `area`
- `price`
- `deposit`
- `view_count`
- `description`
- `latitude`
- `longitude`
- `status`
- `rejection_reason`
- `created_at`
- `updated_at`

Represents both:
- rental listings,
- roommate-finding listings.

### `post_image`
Image list for a post.

### `amenity`
Amenity catalog.

### `post_amenity`
Join table between post and amenity, with condition state.

### `comment`
Comment tree for a post.

Important fields:
- `id`
- `user_id`
- `post_id`
- `parent_id`
- `content`
- `status`
- timestamps

### `report`
Moderation record.

Important fields:
- `id`
- `user_id` (report creator)
- `admin_id` (handler)
- `reported_object_id`
- `reported_user_id`
- `reason`
- `status`
- `admin_note`
- timestamps

### `notification`
System-generated notification for a user.

### `system_feedback`
User feedback / complaint / bug report.

### `student_demand`
Stored demand profile for matching.

Important fields:
- `student_id`
- `ward_id`
- `university_id`
- `min_price`
- `max_price`
- `room_type`
- `is_looking_roommate`
- `roommate_gender`
- `roommate_criteria`

### `demand_amenity`
Join table between student demand and amenity.

### `student_favourite_post`
Join table between student and saved posts.

### `accommodation_request`
Join table / transactional entity between student and post.

Important fields:
- `post_id`
- `student_id`
- `status`
- `created_at`

### `student_evaluate_host`
Student-to-host review record.

Important fields:
- `host_id`
- `student_id`
- `description`
- `number_star`
- `created_at`

---

## 7.3 Relationship map

### Identity and roles
- `user` 1 - 0..1 `student`
- `user` 1 - 0..1 `host`

### Location
- `district` 1 - * `ward`
- `ward` 1 - * `post`
- `ward` 1 - * `university`
- `university` 1 - * `student`
- `ward` can also be referenced by `student_demand`

### Content
- `user` 1 - * `post`
- `post` 1 - * `post_image`
- `post` * - * `amenity` through `post_amenity`

### Interaction
- `user` 1 - * `comment`
- `post` 1 - * `comment`
- `comment` 1 - * `comment` through `parent_id` (nested replies)
- `student` * - * `post` through `student_favourite_post`
- `student` * - * `post` through `accommodation_request`
- `student` * - * `host` through `student_evaluate_host`

### Matching
- `student` 1 - 0..1 or 1 - * `student_demand`  
  The document is unclear, but the schema suggests **one active demand profile per student** because `student_id` is used like a primary key.

- `student_demand` * - * `amenity` through `demand_amenity`

### Moderation and support
- `user` 1 - * `report` as reporter
- `user` 1 - * `report` as reported account (optional relationship)
- `admin` handles `report`
- `user` 1 - * `system_feedback`
- `user` 1 - * `notification`

---

## 8. Class-level intent from the design

The class design mirrors the DB model closely.

### Core behavioral classes
- `User`: login, logout, change password, update profile
- `Student`: create demand, evaluate host, manage favorites
- `Host`: verify account, create post
- `Post`: increase view count, change status, update post
- `StudentDemand`: match with post, update demand
- `AccommodationRequest`: send, approve, reject
- `Comment`: add reply, edit, delete
- `Report`: process report, update status
- `SystemFeedback`: send feedback
- `Notification`: mark read
- `District/Ward/University/Amenity`: reference and lookup support

The class model is mainly **entity-centric**, not a rich domain model with many standalone services.  
For implementation, the complex logic should probably live in service classes, not only in entities.

---

## 9. Suggested REST API surface (inferred from the design)

The document does **not** define actual endpoints.  
The API list below is **inferred** from the use cases, schema, and package design.

## 9.1 Auth and account
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/verify-email`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /me`
- `PATCH /me`
- `PATCH /me/password`

## 9.2 Reference data
- `GET /districts`
- `GET /districts/{id}/wards`
- `GET /universities`
- `GET /amenities`

These are needed to drive filters/forms.

## 9.3 Posts
- `GET /posts`
  - filters: `q`, `districtId`, `wardId`, `universityId`, `roomType`, `purpose`, `minPrice`, `maxPrice`, `amenityIds`, `sort`, `page`
- `GET /posts/{id}`
- `POST /posts`
- `PATCH /posts/{id}`
- `DELETE /posts/{id}` or soft-delete/hide
- `POST /posts/{id}/hide`
- `POST /posts/{id}/images`
- `DELETE /posts/{id}/images/{imageId}`
- `POST /posts/compare`
- `POST /posts/{id}/view` (optional if view count is not incremented automatically on GET)

## 9.4 Favorites
- `POST /posts/{id}/favorite`
- `DELETE /posts/{id}/favorite`
- `GET /me/favorites`

## 9.5 Comments
- `GET /posts/{id}/comments`
- `POST /posts/{id}/comments`
- `POST /comments/{id}/replies`
- `PATCH /comments/{id}`
- `DELETE /comments/{id}`

## 9.6 Student demand and matching
- `GET /me/demand`
- `PUT /me/demand`
- `GET /me/demand/matches`

Possible backend behavior:
- returns ranked posts,
- includes compatibility score,
- may include explanation fields like matched amenities / price fit / area fit.

## 9.7 Accommodation / roommate requests
- `POST /posts/{id}/requests`
- `GET /me/requests`
- `GET /posts/{id}/requests` (for post owner)
- `PATCH /requests/{postId}/{studentId}`
  - body example: `{ "action": "ACCEPT" | "REJECT" }`

## 9.8 Reports and feedback
- `POST /reports`
- `POST /feedback`
- `GET /me/notifications`
- `PATCH /notifications/{id}/read`
- `PATCH /notifications/read-all`

## 9.9 Admin APIs
- `GET /admin/reports`
- `GET /admin/reports/{id}`
- `PATCH /admin/reports/{id}`
- `GET /admin/hosts/verification-candidates`
- `POST /admin/hosts/{id}/verify`
- `GET /admin/stats/posts`
- `GET /admin/stats/areas`
- `GET /admin/stats/users`
- `GET /admin/stats/traffic`

## 9.10 External service boundaries
The system likely needs these integrations:

- **AI moderation API**
  - submit text/images
  - return moderation decision + reasons

- **Image storage**
  - cloud file upload or media CDN

- **Map/geocoding API**
  - listing map display
  - possibly address -> coordinates

- **Email / push notifications**
  - account verification
  - post moderation result
  - new matches / request updates

- **Zalo deep link / contact reveal**
  - not necessarily a true API integration,
  - but the design assumes contact handoff after acceptance.

---

## 10. Suggested backend service modules

To make implementation easier, AI coding tools should treat these as service boundaries.

### AuthService
- register
- login
- verify email
- password reset
- role/session handling

### UserService
- get/update profile
- role-specific profile enrichment
- account status checks

### PostService
- create/update/hide/delete post
- load listing details
- increment view count
- publish/unpublish flow

### SearchService
- filter/sort/paginate posts
- compare posts
- location and amenity filtering

### ModerationService
- call AI bot
- interpret moderation result
- escalate to admin review
- store rejection reason

### DemandService
- save student demand
- run compatibility scoring
- return ranked matches

### RequestService
- create accommodation request
- accept/reject request
- reveal contact channel after acceptance

### FavoriteService
- toggle favorite
- load user favorites

### CommentService
- create comment/reply
- nested comment retrieval
- hide/delete moderation hooks

### ReportService
- create report
- process report
- apply sanctions

### NotificationService
- create/send notifications
- mark read
- trigger from domain events

### AnalyticsService
- area statistics
- post statistics
- user growth
- traffic aggregation

### VerificationService
- identify host verification candidates
- approve trusted host status

---

## 11. Key implementation rules implied by the design

1. **Only approved posts should appear in public search results.**
2. **Post creation and post update both pass through moderation.**
3. **Contact information should be partially hidden until a request is accepted.**
4. **Favorites are user-specific and should survive across sessions.**
5. **Comments support nested replies.**
6. **Admin moderation can affect both content status and account status.**
7. **Student demand is a durable profile used for both immediate matching and future notifications.**
8. **Search is central; location, price, room type, and amenities are first-class filters.**
9. **A single post model supports both rental listings and roommate-finding listings via `purpose`.**
10. **Notifications are event-driven and should be triggered by domain changes.**

---

## 12. Important ambiguities and inconsistencies to resolve before coding

These are important because AI coding tools should not assume the design is fully normalized.

### A. Backend technology conflict
The document mentions both:
- **ASP.NET Core Web API**
- **ExpressJS / NodeJS-style layered backend**

Recommendation:
- pick one stack and treat the current design as framework-agnostic REST architecture.

### B. Request status naming inconsistency
The enums section mentions something like:
- `accomodation_request_status`

But the actual request table uses:
- `request_status`

Recommendation:
- standardize to a single enum name, for example `accommodation_request_status`.

### C. Amenity condition naming inconsistency
The enum list mentions:
- `amenity_condition`

But the join table uses:
- `current_condition`

Recommendation:
- keep enum name separate from field name, e.g.
  - field: `current_condition`
  - enum type: `amenity_condition`

### D. Student demand identity inconsistency
The class model shows `StudentDemand` with an `id`.
The database table appears to use `student_id` as the primary key.

Recommendation:
- decide whether a student can have:
  - one current demand profile only, or
  - multiple saved demand versions/history.

### E. Notification model mismatch
The class design includes `isRead`,
but the shown table fields do not clearly include it.

Recommendation:
- add `is_read boolean not null default false`.

### F. System feedback mismatch
The DB uses something like `number_star`,
while the class uses `rating`.

Recommendation:
- standardize to one field name.

### G. Host verification criteria conflict
One part of the document suggests:
- host verification may involve uploaded documents and admin review.

Another use case suggests:
- verification is granted when hosts reach >= 4.5 stars and enough reviews.

Recommendation:
- choose one rule:
  - document-based verification,
  - reputation-based verification,
  - or a combined process.

### H. Report target modeling is incomplete
The `report` model mixes:
- reported object id,
- reported user id,
- possibly post/comment/account reporting.

Recommendation:
- add explicit `reported_object_type` enum:
  - `POST`, `COMMENT`, `USER`

This will make moderation logic much cleaner.

---

## 13. Recommended MVP build order

If another AI tool helps with coding, it should build in this order:

1. auth + user profile
2. reference data (district, ward, university, amenity)
3. post CRUD + image upload
4. public search + detail page
5. favorites
6. comments/replies
7. AI moderation integration
8. student demand + matching
9. accommodation requests + contact reveal
10. reports + admin moderation
11. notifications
12. statistics/admin dashboards
13. host verification workflow

---

## 14. Practical summary for code generation

If you need to generate code, think of UNISTAY as:

- a **React SPA**
- talking to a **REST JSON backend**
- centered around the `Post` entity
- with **role-based behavior** (`Student`, `Host`, `Admin`)
- plus a second important entity: `StudentDemand`
- and two major workflow engines:
  - **moderation**
  - **matching**

The most important modules to get right are:

- `auth`
- `posts`
- `search`
- `matching`
- `requests`
- `moderation`
- `notifications`

---

## 15. Minimal canonical domain model to keep in mind

If an AI tool needs a compact mental model, use this:

- `User`
  - specialized into `Student` and `Host`
- `Post`
  - owned by a user
  - typed by purpose and room type
  - located in a ward
  - has images and amenities
- `StudentDemand`
  - stores a student's target rental/roommate preferences
- `AccommodationRequest`
  - connects a student to a post
- `Comment`
  - nested discussion under a post
- `Report`
  - moderation event over post/comment/user
- `Notification`
  - event message to a user
- `SystemFeedback`
  - bug/complaint/suggestion record

That is the core of the system.

---

## 16. What not to overfocus on yet

For the current design-to-code phase, the document's testing section, formatting conventions, and broader non-functional details are less important than:

- getting the domain model right,
- keeping statuses/enums consistent,
- defining clean service boundaries,
- implementing the post + search + matching + moderation flows correctly.
