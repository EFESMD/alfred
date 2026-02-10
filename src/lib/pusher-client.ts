import PusherClient from "pusher-js";

export const pusherClient = 
  process.env.NEXT_PUBLIC_PUSHER_KEY 
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1",
      })
    : null;