alter table public.quotations
  add column if not exists discount double precision not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotations_discount_nonnegative'
      and conrelid = 'public.quotations'::regclass
  ) then
    alter table public.quotations
      add constraint quotations_discount_nonnegative check (discount >= 0);
  end if;
end
$$;
