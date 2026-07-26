// Written as a direct literal member access so Next inlines the value at build
// time. Demo mode auto-provisions a throwaway account on the API so a public
// deployment can be explored without registering.
export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
