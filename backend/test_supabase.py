from app.services.storage import _get_supabase, BUCKET_NAME
client = _get_supabase()
if client:
    try:
        buckets = client.storage.list_buckets()
        names = [b.name for b in buckets]
        print(f'Supabase connected OK. Buckets: {names}')
        if BUCKET_NAME in names:
            print(f'Bucket "{BUCKET_NAME}" EXISTS')
        else:
            print(f'Bucket "{BUCKET_NAME}" NOT FOUND - will be auto-created on first upload')
    except Exception as e:
        print(f'Supabase error: {e}')
else:
    print('Supabase client could not be created')
