-- Guests browse vendors before signing in; the vendor list embeds vendor_reviews(rating),
-- so without this grant the whole list fails with 42501. RLS (reviews_public_read) still
-- limits anon to verified reviews; author_id and event_id stay hidden.
grant select (id, vendor_id, rating, body, reply, verified, created_at, photo_paths)
  on kendurikita.vendor_reviews to anon;
