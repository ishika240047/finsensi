import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Checks if the logged-in Clerk user exists in our database, or creates them if they're new
export const checkUser = async () => {
  // Get current logged-in user details from Clerk
  const user = await currentUser();

  // If no user is signed in, return null
  if (!user) {
    return null;
  }

  try {
    // Look up the user in our database by their Clerk user ID
    const loggedInUser = await prisma.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    // If user already exists in the database, return their data
    if (loggedInUser) {
      return loggedInUser;
    }

    // Format full name from Clerk profile
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    // If it's a new user, save their profile to the database
    const newUser = await prisma.user.create({
      data: {
        clerkUserId: user.id,
        name: name || null,
        imageUrl: user.imageUrl,
        email: user.emailAddresses[0].emailAddress,
      },
    });

    return newUser;
  } catch (error) {
    // Log if anything goes wrong during database sync
    console.error("Error in checkUser:", error);
    return null;
  }
};

