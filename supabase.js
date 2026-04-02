/* supabase.js — Supabase client & data helpers */

const SUPABASE_URL      = 'https://mxdvqmskpezbngrzwcrt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZHZxbXNrcGV6Ym5ncnp3Y3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjI2NTMsImV4cCI6MjA5MDY5ODY1M30.IoytQEi612uLTmWoQbSRS8l-dyg6JcVQI9_LXPyVHdc';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const db = {

  /* ── Posts ── */
  async getPosts() {
    const { data, error } = await sb.from('posts').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getPosts:', error.message); return []; }
    return data || [];
  },
  async insertPost(p) {
    const { data, error } = await sb.from('posts').insert(p).select().single();
    if (error) throw error;
    return data;
  },
  async updatePost(id, p) {
    const { error } = await sb.from('posts').update(p).eq('id', id);
    if (error) throw error;
  },
  async deletePost(id) {
    const { error } = await sb.from('posts').delete().eq('id', id);
    if (error) throw error;
  },

  /* ── Photos ── */
  async getPhotos() {
    const { data, error } = await sb.from('photos').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getPhotos:', error.message); return []; }
    return data || [];
  },
  async insertPhoto(p) {
    const { data, error } = await sb.from('photos').insert(p).select().single();
    if (error) throw error;
    return data;
  },
  async updatePhoto(id, p) {
    const { error } = await sb.from('photos').update(p).eq('id', id);
    if (error) throw error;
  },
  async deletePhoto(id) {
    const { error } = await sb.from('photos').delete().eq('id', id);
    if (error) throw error;
  },

  /* ── Photo Comments ── */
  async getPhotoComments(photoId) {
    const { data, error } = await sb.from('photo_comments').select('*').eq('photo_id', photoId).order('created_at', { ascending: true });
    if (error) { console.error('getPhotoComments:', error.message); return []; }
    return data || [];
  },
  async insertPhotoComment(c) {
    const { data, error } = await sb.from('photo_comments').insert(c).select().single();
    if (error) throw error;
    return data;
  },

  /* ── Episodes ── */
  async getEpisodes() {
    const { data, error } = await sb.from('episodes').select('*').order('created_at', { ascending: false });
    if (error) { console.error('getEpisodes:', error.message); return []; }
    return data || [];
  },
  async insertEpisode(ep) {
    const { data, error } = await sb.from('episodes').insert(ep).select().single();
    if (error) throw error;
    return data;
  },
  async updateEpisode(id, ep) {
    const { error } = await sb.from('episodes').update(ep).eq('id', id);
    if (error) throw error;
  },
  async deleteEpisode(id) {
    const { error } = await sb.from('episodes').delete().eq('id', id);
    if (error) throw error;
  },

  /* ── Site config ── */
  async getConfig() {
    const { data, error } = await sb.from('site_config').select('*');
    if (error) { console.error('getConfig:', error.message); return {}; }
    const cfg = {};
    (data || []).forEach(r => { cfg[r.key] = r.value; });
    return cfg;
  },
  async setConfig(key, value) {
    const { error } = await sb.from('site_config').upsert({ key, value });
    if (error) throw error;
  },

  /* ── Storage: upload image, return public URL ── */
  async uploadImage(file, folder = 'uploads') {
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await sb.storage.from('images').upload(path, file);
    if (error) throw error;
    const { data } = sb.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
  }
};
