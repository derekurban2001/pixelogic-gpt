import { SupabaseClient } from "@supabase/supabase-js";
import type { RequestHandler } from "@sveltejs/kit";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
    }
  }
}

export const GET: RequestHandler = async ({
  request,
  locals: { supabase },
}) => {
  return new Response();
};

/** @type {import('./$types').Actions} */
export const actions = {
  default: async (event) => {
    // TODO log the user in
  },
};
