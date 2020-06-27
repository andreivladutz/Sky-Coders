import { precacheAndRoute } from "workbox-precaching";
import {
  setDefaultHandler,
  setCatchHandler,
  registerRoute
} from "workbox-routing";
import { StaleWhileRevalidate, NetworkOnly } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

// the user chose to reload the page to activate the new service worker
addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    skipWaiting();
  }
});

// return the cache-stored assets while also updating the cache from the network in the background
registerRoute(matchRequests, new StaleWhileRevalidate(), "GET");

registerRoute(matchRequests, new NetworkOnly(), "POST");

// Don't let the service worker interact with the users route
function matchRequests({ url }) {
  if (url.pathname.includes("/users")) {
    return false;
  }

  return true;
}

// If any route fails -> this handler gets called if neither the cache, nor the network can handle a request
// TODO: offline page logic
setCatchHandler(({ event }) => {
  if (event.request.destination === "document") {
    console.log("Failed to get a document");
  } else {
    // default response error
    return Response.error();
  }
});
