# Password Protection Setup

## Environment Variable Setup

To enable password protection, you need to set up the environment variable:

1. Create a `.env.local` file in the root directory of the project
2. Add the following line to the file:
   ```
   APP_PASS=2197
   ```

## How it works

- The application will show a password prompt when first accessed
- Enter the password `2197` to access the system
- The authentication state is stored in localStorage, so you won't need to re-enter the password on the same browser session
- Use the "Logout" button in the top-right corner to log out and return to the password prompt

## Security Note

This is a simple client-side password protection. For production use, consider implementing more robust authentication methods.
