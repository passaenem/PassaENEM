SELECT 
    event_object_schema as table_schema,
    event_object_table as table_name,
    trigger_schema,
    trigger_name,
    string_agg(event_manipulation, ',') as event,
    action_timing as activation,
    condition_timing,
    action_statement as definition
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
GROUP BY 1,2,3,4,6,7,8;

SELECT pg_get_triggerdef(oid) as trigger_def
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass;
