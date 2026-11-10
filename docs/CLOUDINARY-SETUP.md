# Cloudinary image upload setup

Rwanda Today uploads images directly from the administrator's browser to Cloudinary. The backend creates a short-lived signed upload request; the Cloudinary API secret is never sent to the browser.

## Configure Cloudinary

1. Create or sign in to a Cloudinary account.
2. Open the Cloudinary Console and copy the cloud name and API key.
3. Create a signed upload preset for Rwanda Today. Restrict it to the image formats you intend to accept and configure sensible upload limits.
4. Copy the API secret privately.
5. Add these values to the backend environment settings or your private `server/.env` file:

   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `CLOUDINARY_UPLOAD_PRESET`
   - `CLOUDINARY_FOLDER` (optional; defaults to `rwanda-today`)

6. Restart the backend.
7. Sign in to the Rwanda Today admin dashboard, choose an image in the article editor and upload it. The returned HTTPS URL is placed in the article's featured-image field.
8. Save the article to persist that URL in MongoDB.

## Security

- Keep the API secret only in backend environment variables.
- Do not commit credentials or paste them into ChatGPT.
- The signature endpoint requires an administrator session.
- Browser-side checks allow JPG, PNG, WEBP and GIF files up to 10 MB. Also enforce upload restrictions in the Cloudinary signed preset because browser checks can be bypassed.
- Cloudinary video uploads, a reusable media library and automatic asset cleanup are not part of this image-upload implementation yet.
