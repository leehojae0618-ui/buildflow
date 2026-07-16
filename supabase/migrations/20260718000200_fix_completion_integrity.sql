create policy "Users can insert their execution events"
on public.execution_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.build_executions e
    where e.id = execution_id
      and e.user_id = (select auth.uid())
      and exists (
        select 1
        from public.projects p
        where p.id = e.project_id
          and p.user_id = (select auth.uid())
      )
  )
);
