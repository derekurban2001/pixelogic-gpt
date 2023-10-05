import type { SupabaseClient } from "@supabase/supabase-js";
import {
  get,
  writable,
  type Subscriber,
  type Writable,
  type Invalidator,
} from "svelte/store";

class SveltebaseTable<RawT extends { [key: string]: any }, InsertT, TablesT> {
  private supabase?: SupabaseClient;
  private store: Writable<Map<string, RawT>>;
  private id_key: string;
  private table_name: string;
  constructor(id_key: keyof InsertT, table_name: keyof TablesT) {
    this.store = writable<Map<string, RawT>>(new Map<string, RawT>());
    this.id_key = id_key as string;
    this.table_name = table_name as string;
  }

  public initSupabase(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  public subscribe(
    run: Subscriber<Map<string, RawT>>,
    invalidate?: Invalidator<Map<string, RawT>> | undefined
  ) {
    return this.store.subscribe(run, invalidate);
  }
  public async upsert(to_upsert: Array<InsertT>) {
    if (!this.supabase) return { error: "Supabase not initialized" };
    if (!to_upsert || to_upsert.length == 0)
      return { error: "Cannot upsert nothing" };

    const upsert_call = await this.supabase
      .from(this.table_name)
      .upsert(to_upsert, { onConflict: this.id_key, ignoreDuplicates: false })
      .select();

    if (upsert_call.error)
      return {
        error: `${upsert_call.error.code}: ${upsert_call.error.message}`,
      };

    this.store.update((map) => {
      upsert_call.data.forEach((d) => {
        map.set(d[this.id_key], d);
      });
      return map;
    });
    return { data: structuredClone(upsert_call.data) };
  }
  public get = async (ids?: Array<string>) => {
    if (!this.supabase) return { error: "Supabase not initialized" };
    const current_store = get(this.store);
    const data: Array<RawT> = [];
    const unadded_ids: Array<string> = [];

    ids?.forEach((id) => {
      const d = current_store.get(id);
      if (d) data.push(d);
      else unadded_ids.push(id);
    });

    if (ids && ids.length > 0 && unadded_ids.length == 0)
      return { data: structuredClone(data) };

    let get_call;
    if (!ids || ids.length == 0)
      get_call = await this.supabase.from(this.table_name).select("*");
    else if (ids.length == 1)
      get_call = await this.supabase
        .from(this.table_name)
        .select("*")
        .eq(this.id_key, unadded_ids[0]);
    else
      get_call = await this.supabase
        .from(this.table_name)
        .select("*")
        .in(this.id_key, unadded_ids);

    if (get_call.error)
      return { error: `${get_call.error.code}: ${get_call.error.message}` };

    if (get_call.data) data.push(...get_call.data);

    this.store.update((map) => {
      data.forEach((d) => {
        map.set(d[this.id_key], d);
      });
      return map;
    });

    return { data: structuredClone(data) };
  };
  public async delete(ids: Array<string>) {
    if (!this.supabase) return { error: "Supabase not initialized" };
    if (!ids || ids.length == 0) return { error: "Cannot delete nothing" };

    let delete_call;
    if (ids.length == 1)
      delete_call = await this.supabase
        .from(this.table_name)
        .delete()
        .eq(this.id_key, ids[0]);
    else
      delete_call = await this.supabase
        .from(this.table_name)
        .delete()
        .in(this.id_key, ids);

    if (delete_call.error)
      return {
        error: `${delete_call.error.code}: ${delete_call.error.message}`,
      };

    this.store.update((map) => {
      ids.forEach((id) => {
        map.delete(id);
      });
      return map;
    });
    return { error: undefined };
  }
}
