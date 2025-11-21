# File uploads

## Frontend responsibilities

### Clipboard and file intake

* Detect pasted images through the browser’s `paste` event.
* Detect dropped image files (drag-and-drop).
* Detect image selection via file picker.
* Support multiple images in one action (optional).

### Pre-upload handling

* Show local previews of selected images.
* Enforce client-side limits for UX only (not security):

  * Max file size.
  * Allowed MIME types (`image/*`).
  * Max number of images.
* Provide a way to remove images before upload.
* Display upload progress and upload errors.

### Upload behavior

* Send files via standard multipart upload or a dedicated upload endpoint.
* Include authentication (cookies, tokens).
* Handle retries or cancellation.
* After successful upload, insert the final image reference into the chat input or message thread.

---

### Backend responsibilities

### File intake and constraints

* Require authentication.
* Limit max upload size at server and reverse-proxy levels.
* Restrict allowed file formats to known image types.
* Reject files that exceed pixel or byte limits.

### Actual file validation

* Inspect magic bytes to determine actual format.
* Decode the image using an image library to ensure it’s real and well-formed.
* Reject malformed files or non-image content disguised as images.

### Normalization and sanitization

* Re-encode the image to a safe, known format (JPEG/PNG/WebP).
* Strip EXIF and other metadata.
* Optionally downscale images exceeding max dimensions.
* Remove transparency if needed for consistency.

### Storage

* Generate a unique file name or ID.
* Store re-encoded images in object storage (S3, GCS, R2, MinIO) or a similar blob store.
* Avoid serving files directly from the app server’s filesystem.

### Delivery

* Generate URLs for the sanitized, stored images.
* Optionally use signed URLs or short-lived access tokens.
* Set correct cache headers.
* Make sure files are served with correct `Content-Type`.

### Logging and monitoring

* Log:

  * File size
  * File type detected from magic bytes
  * Dimensions
  * User ID
  * Storage location
* Alert on:

  * Unusually large files
  * Repeated failed validations
  * Upload volume spikes

### Security hardening

* Enforce HTTPS to prevent MITM tampering.
* Rate-limit upload endpoints.
* Ensure no user-provided filenames are used directly.
* Ensure no metadata or user-controlled values leak back in responses.

---

# Optional features typically added

### Frontend

* Image editing (crop, rotate).
* Retry failed uploads.
* Drag to reorder before sending.
* Upload “queue” UI.

### Backend

* Virus scanning (if you later choose).
* Thumbnail generation.
* Multiple resolutions for responsive display.
* CDN distribution.

---

If you want, I can turn this into a compact spec document, a sequence diagram, or an implementation plan tailored to your stack.

