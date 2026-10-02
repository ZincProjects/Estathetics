-- PDPA: let a signed-in user delete their own account and all their data.
-- Deleting the auth user cascades to every row that references it.
-- Storage files are removed by the app first (storage rows can't be deleted via SQL).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
