import { precacheAndRoute } from "workbox-precaching";
import { setDefaultHandler, setCatchHandler } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

// the user chose to reload the page to activate the new service worker
addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    skipWaiting();
  }
});

// return the cache-stored assets while also updating the cache from the network in the background
setDefaultHandler(new StaleWhileRevalidate());

// If any route fails
// TODO: offline page logic
setCatchHandler(({ event }) => {
  if (event.request.destination === "document") {
    console.log("Failed to get a document");
  } else {
    // default response error
    return Response.error();
  }
});
