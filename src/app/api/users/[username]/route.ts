// /api/users/[username]/route.ts

import axios from "axios";
import {  NextResponse } from "next/server";

const cache = new Map();
const CACHE_DURATION = 15 * 60 * 1000;


export default async function GET({ params }: { params: { username: string } }) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  const cacheData = cache.get(username);

  if (cacheData && Date.now() - cacheData.timestamp < CACHE_DURATION) {
    return NextResponse.json(cacheData.data);
  }

  try {
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        params: {
          "user.fields":
            "description,public_metrics,profile_image_url,created_at,location,verified,url,entities",
        },
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "User-Agent": "twitte_anime_app",
        },
      }
    );

    if (response.data.errors) {
      return NextResponse.json({
        error: "User data not found",
        details: response.data.errors,
      });
    }

    const userData = response.data.data;
    const followRatio =
      userData.public_metrics.follower_count > 0
        ? (
            userData.public_metrics.following_count /
            userData.public_metrics.follower_count
          ).toFixed(2)
        : 0;

    const accountAge = Math.floor(
      (new Date().getTime() - new Date(userData.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const tweetsPerDay = (
      userData.public_metrics.tweet_count / accountAge
    ).toFixed(2);

    const completeUserData = {
      ...userData,
      followRatio,
      accountAge,
      tweetsPerDay,
    };
    console.log(completeUserData);
    

    cache.set(username, { data: completeUserData, timestamp: Date.now() });

    return NextResponse.json(completeUserData);
  } catch (error: unknown) {
    console.error("Error getting user details:", error);

    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 401) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid or expired Twitter bearer token" },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}