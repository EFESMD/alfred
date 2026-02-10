import Pusher from "pusher";

export const pusherServer = 
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
        useTLS: true,
      })
    : null;