# VibeScape: Your Personal Music Universe

VibeScape is an experimental music discovery and visualization tool that connects to your Spotify account to help you find the perfect playlist for any mood and explore the hidden connections within your music library. It uses a combination of data visualization and cutting-edge AI to provide a unique and insightful look into your musical taste.

## Key Features

- **Interactive Song Map**: A stunning visual graph of your playlists and songs.
  - **Visual Clusters**: Playlists are represented as large colored circles, with their constituent songs clustered around them.
  - **Song Connections**: Lines are drawn between songs that appear in the same playlist, revealing the musical fabric of your library.
  - **Popularity-Based Sizing**: Song nodes are sized based on their popularity on Spotify, making it easy to spot your most popular tracks.
  - **Rich Filtering & Sorting**: Easily select which playlists to display, filter by the number of top or random songs, and sort your playlists by name, date created, or last modified.
  - **Search**: Quickly find specific playlists within your library.

- **AI Playlist Chooser**: An intelligent assistant to find the perfect vibe.
  - **Mood-Based Recommendations**: Simply enter a mood (e.g., "rainy day study," "energetic workout," "melancholic evening"), and the AI will recommend the top 3 playlists from your library that match.
  - **Advanced Hybrid Algorithm**: VibeScape uses a sophisticated, multi-step process that blends AI analysis with algorithmic sampling to ensure high-quality, transparent recommendations.
  - **"How It Works" Transparency**: An in-app dialog explains the exact steps the algorithm takes, so you know it's more than just a guess.

## Local Setup and Configuration Guide (A-Z)

This guide will walk you through every step required to get the VibeScape application running on your local machine.

### Step 1: Prerequisites

Before you begin, ensure you have the following software installed on your computer:

- **Node.js**: VibeScape is a Node.js application. We recommend using the latest LTS (Long-Term Support) version. You can download it from [nodejs.org](https://nodejs.org/).
- **npm (or yarn)**: Node.js comes with npm (Node Package Manager) pre-installed. You'll use this to install the project's dependencies.
- **Git**: You need Git to clone the repository from its source. You can download it from [git-scm.com](https://git-scm.com/downloads).

### Step 2: Clone the Repository

Open your terminal or command prompt and navigate to the directory where you want to store the project. Then, run the following command to clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

Replace `<repository-url>` with the actual URL of the Git repository and `<repository-directory>` with the name of the folder created by the clone command.

### Step 3: Install Project Dependencies

Once you are inside the project's root directory, install all the necessary packages defined in `package.json` by running:

```bash
npm install
```
This command will download and install all the required libraries, such as Next.js, React, and Genkit.

### Step 4: Configure Spotify Credentials

The application needs access to your Spotify data. For local development, this is done using a temporary **Access Token**.

**Important Note on the Access Token:** This token provides temporary, secure access to your Spotify data. It expires after about one hour. If the app stops working and you see a `401 Unauthorized` or `token expired` error, you will need to repeat these steps to generate a new one.

**Future Improvement:** A full production app would implement a complete Spotify OAuth 2.0 login flow. This would allow users to log in with their Spotify account, grant permissions, and the application would automatically manage token refreshing in the background. For this local setup, we use a manual token for simplicity.

**How to Generate Your Spotify Access Token:**

1.  **Go to the Spotify Developer Dashboard**: Open your web browser and navigate to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2.  **Log In**: Log in with your regular Spotify account.
3.  **Create an App**:
    - Click the **"Create app"** button.
    - Give your app a **Name** (e.g., "VibeScape Local Dev") and a **Description**.
    - Agree to the terms and click **"Create"**.
4.  **Go to the Spotify Console**: To get a token with the right permissions (scopes), the easiest way is through the Spotify Web API Console. Open this link in a new tab: [**Get Current User's Profile Console**](https://developer.spotify.com/console/get-current-user/).
5.  **Get Token and Select Scopes**:
    - On the console page, click the green **"Get Token"** button on the left.
    - A popup will appear asking you to authorize the necessary permissions (scopes). For VibeScape to function correctly, you **must check the following boxes**:
        - `playlist-read-private`
        - `playlist-read-collaborative`
    - After checking the boxes, scroll down and click the green **"Request Token"** button.
6.  **Copy the Access Token**: You will be prompted to log in to Spotify again to grant access. After you do, you'll be returned to the console page. Your new OAuth Access Token will be displayed. It's a very long string of letters and numbers. Click the **"Copy"** button to copy it to your clipboard.

### Step 5: Set Up Environment Variables

The project uses a `.env` file to store sensitive information like your access token.

1.  In the root directory of the project, find the file named `.env` and open it.
2.  Add the following line to the file, pasting the token you copied in the previous step:

```
SPOTIFY_ACCESS_TOKEN=YOUR_LONG_ACCESS_TOKEN_HERE
```
Replace `YOUR_LONG_ACCESS_TOKEN_HERE` with the actual token. **Do not wrap it in quotes.**

### Step 6: Run the Application

You're all set! To start the local development server, run the following command in your terminal from the project's root directory:

```bash
npm run dev
```

This will start the Next.js application. Once it's ready, it will typically be available at:

**http://localhost:9002**

Open this URL in your web browser. You should now see the VibeScape application running, populated with your personal Spotify playlist data!
