# Changelog

All notable changes to MilestoneX API are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Campaign search history tracking service (`SearchHistoryService`) and `SearchHistory` Prisma model
- Campaign bookmark/save feature (`BookmarksService`) with `CampaignBookmark` Prisma model
- Donation receipt generation service (`DonationReceiptService`) with deterministic receipt numbers
- Campaign progress percentage (`progressPercentage`) field in `getCampaignStats` response
- Milestone completion endpoint `POST /campaigns/:id/milestones/:id/complete`
- Dispute filing endpoint `POST /disputes` (authenticated users)
- Admin dispute resolution endpoint `POST /admin/disputes/:id/resolve`
- Newsletter subscription endpoints `POST /newsletter/subscribe` and `DELETE /newsletter/unsubscribe`
- Campaign category listing endpoint `GET /campaigns/categories`
- User activity summary endpoint `GET /users/me/activity`
- Pagination helper utility (`src/common/pagination.helper.ts`)
- Response envelope wrapper helper (`src/common/response.helper.ts`)
- Centralized error message constants (`src/common/error-messages.ts`)
- `RequestIdMiddleware` for per-request tracing via `x-request-id` header
- Campaign status transition validation (`assertValidStatusTransition`)
- `DisputesController` registered in `AdminModule`
- `NewsletterController` registered in `NotificationsModule`
- `.nvmrc` pinned to Node.js v20
- `.editorconfig` for consistent editor settings
- `docker-compose.yml` for local development environment
- `CONTRIBUTING.md` contributor guide
- `CHANGELOG.md` (this file)

### Changed
- `UpdateCampaignDto` now supports `category` and `endDate` fields
- `updateCampaign` service method validates ownership and future `endDate`
- `CampaignsController.update` now correctly uses `req.user.sub` (JWT subject) instead of `req.user.id`
- `createCampaign` validates that `endDate` is in the future when provided
- `getCampaignStats` safely handles zero-donation campaigns and returns `progressPercentage`
- `CreateCampaignDto` hardened with `MinLength`, `IsDateString`, and `Transform.trim` sanitization
- `DonationsService` now has structured logging on critical paths
- `NotificationsGateway` has improved null/type checks on JWT payload
- `NotificationsController` now has explicit `@UseGuards(JwtAuthGuard)` on all mark-read endpoints
- `ExportProcessor` has proper error handling, structured logging, and date validation
- Swagger decorators added to `CampaignsController`, `UsersController`, `DonationsController`, `AdminController`
- JSDoc added to campaign service private helpers, `StellarTransactionsService`, and `AuthVerifyController`
- `package.json` scripts: added `lint:fix` and `format:check`; separated `lint` from auto-fix

### Fixed
- Missing `donatedAt` index on the `donations` table added to Prisma schema
- Milestone `dueDate` validation now enforces future dates
- Fund release amount now validated against available `raisedAmount` (not just milestone target)
- Campaign stats edge case with zero donations resolved

---

## [0.1.0] — 2026-01-01

### Added
- Initial release with Stellar wallet authentication
- Campaign CRUD with milestone support
- Blockchain-verified donation processing
- WebSocket real-time notifications
- Admin moderation dashboard
- CSV export with async Bull queue support
- Full-text campaign search with PostgreSQL `tsvector`
