import { auth, currentUser } from '@clerk/nextjs/server'

export async function getSessionUser() {
  const { userId } = await auth();
  
  if (!userId) {
    return undefined;
  }

  const user = await currentUser();
  
  if (!user) {
    return undefined;
  }

  let isAdmin = false;
  const adminEmailEnv = process.env.ADMIN_EMAIL;
  const userEmail = user.emailAddresses[0]?.emailAddress;
  
  if (adminEmailEnv && userEmail) {
    const adminEmails = adminEmailEnv.split(",");
    isAdmin = adminEmails.includes(userEmail);
  }

  return {
    id: user.id,
    name: user.firstName ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}` : user.username ?? null,
    email: userEmail ?? null,
    image: user.imageUrl ?? null,
    isAdmin,
  };
}
