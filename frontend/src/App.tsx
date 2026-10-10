import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Fuse from 'fuse.js';
import { api, ApiError, authConfigured, demoMode } from './api';
import { text, errorText, type CopyKey } from './i18n';
import { Button, Dialog, Field, Icon, Status, Textarea } from './components';
import { CivicMap } from './Map';
import { haversine, insideArea, nearestDestination, validatePlace } from '../../backend/src/lib/domain.mjs';
import area from '../../data/area.json';
import type { Item, Locale, Place, PlaceType, Point } from './types';
const typeKeys: Record<PlaceType, CopyKey> = { toilet: 'toilets', dustbin: 'dustbin', recycling: 'recycling', ewaste: 'ewaste' };
const types: PlaceType[] = ['toilet', 'dustbin', 'recycling', 'ewaste'];
const initLocale = (): Locale => { try { const v = localStorage.getItem('kahaan-locale'); return v === 'bn' || v === 'hi' ? v : 'en'; } catch { return 'en'; } };
const itemText = (item: Item, locale: Locale) => locale === 'en' ? item : item.translations?.[locale] || item;
const errorCode = (error: unknown) => error instanceof ApiError ? error.code : 'server_error';
const directionUrl = (place: Place) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.approximate ? `${place.name}, ${place.note}, Kolkata` : `${place.lat},${place.lng}`)}`;

export default function App() {
  const [locale, setLocale] = useState<Locale>(initLocale); const t = (key: CopyKey) => text(locale, key);
  const [places, setPlaces] = useState<Place[]>([]), [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(''), [query, setQuery] = useState('');
  const [filter, setFilter] = useState<PlaceType | 'all' | 'bins'>('all'), [view, setView] = useState<'list' | 'map'>('list');
  const [selected, setSelected] = useState<Place | null>(null), [detailOpen, setDetailOpen] = useState(false);
  const [origin, setOrigin] = useState<Point | null>(null), [locating, setLocating] = useState(false), [notice, setNotice] = useState('');
  const [user, setUser] = useState<string | null>(null), [authOpen, setAuthOpen] = useState(false), [addOpen, setAddOpen] = useState(false), [reportOpen, setReportOpen] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false), [voteError, setVoteError] = useState(''), [limit, setLimit] = useState(8);
  const pending = useRef<null | (() => void)>(null); const requestId = useRef(0);
  useEffect(() => { document.documentElement.lang = locale; try { localStorage.setItem('kahaan-locale', locale); } catch { /* browsing remains available */ } }, [locale]);
  async function load(signal?: AbortSignal) {
    const id = ++requestId.current; setLoading(true); setLoadError('');
    try {
      const [data, catalog] = await Promise.all([api.list(signal), fetch('/data/items.json', { signal }).then(r => { if (!r.ok) throw new ApiError('network_error'); return r.json(); })]);
      if (id === requestId.current && !signal?.aborted) { setPlaces(data); setItems(catalog); }
    } catch (error) { if (id === requestId.current && !signal?.aborted) setLoadError(errorCode(error)); }
    finally { if (id === requestId.current && !signal?.aborted) setLoading(false); }
  }
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); void api.user().then(setUser); return () => controller.abort(); }, []);
  useEffect(() => { setLimit(8); }, [filter, query]);
  const fuse = useMemo(() => new Fuse(items, { keys: ['name', 'aliases', 'translations.bn.name', 'translations.bn.aliases', 'translations.hi.name', 'translations.hi.aliases'], threshold: 0.35, ignoreLocation: true }), [items]);
  const matches = query.trim() ? fuse.search(query.trim()).slice(0, 4).map(r => r.item) : [];
  const item = matches[0]; const position = origin || area.center;
  const eligible = item ? places.filter(p => !p.acceptedItemIds || p.acceptedItemIds.includes(item.id)) : places;
  const destination = item ? nearestDestination(eligible, item.placeTypes, position) as Place | null : null;
  const visible = useMemo(() => places.filter(p => filter === 'all' || (filter === 'bins' ? ['dustbin', 'recycling'].includes(p.type) : p.type === filter)).sort((a, b) => haversine(position, a) - haversine(position, b)), [places, filter, origin]);
  const distance = (p: Point) => { const m = haversine(position, p); return m < 1000 ? `${new Intl.NumberFormat(locale).format(Math.round(m / 10) * 10)} m` : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(m / 1000)} km`; };
  function choose(f: typeof filter) { setFilter(f); setQuery(''); setNotice(''); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  function ensureUser(action: () => void) { if (user) action(); else { pending.current = action; setDetailOpen(false); setAuthOpen(true); } }
  function pick(place: Place) { setSelected(place); setVoteError(''); setDetailOpen(true); }
  function update(place: Place) { setPlaces(old => old.some(p => p.placeId === place.placeId) ? old.map(p => p.placeId === place.placeId ? place : p) : [...old, place]); setSelected(place); }
  function locate() {
    if (!navigator.geolocation) { setNotice('locationError'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p => { const point = { lat: p.coords.latitude, lng: p.coords.longitude }; if (insideArea(point.lat, point.lng, area.bbox)) { setOrigin(point); setNotice(''); } else setNotice('locationError'); setLocating(false); }, () => { setNotice('locationError'); setLocating(false); }, { timeout: 10000, maximumAge: 60000 });
  }
  async function vote(place: Place, kind: 'confirm' | 'report', reason = '') {
    if (voteBusy) return; setVoteBusy(true); setVoteError('');
    try { update(await api.vote(place.placeId, kind, reason)); setNotice('voted'); setReportOpen(false); }
    catch (error) { setVoteError(errorCode(error)); if (error instanceof ApiError && error.status === 401) setUser(null); }
    finally { setVoteBusy(false); }
  }
  function placeRow(place: Place) { return <button key={place.placeId} className={`place-row ${selected?.placeId === place.placeId ? 'is-selected' : ''}`} onClick={() => pick(place)}><span className={`place-icon type-${place.type}`}><Icon type={place.type}/></span><span className="place-body"><strong>{place.name}</strong><span className="place-meta">{t(typeKeys[place.type])} · {distance(place)}{place.approximate ? ' ≈' : ''}</span><Status place={place} locale={locale}/></span><span className="row-arrow" aria-hidden="true">↗</span></button>; }
  return <>
    <header className="site-header"><a className="brand" href="/" aria-label="Kahaan"><span className="brand-mark"><Icon type="pin" size={24}/></span>kahaan<span className="brand-dot">.</span></a><span className="header-location"><Icon type="pin" size={16}/> Kolkata</span><div className="header-actions"><label className="locale-control"><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={locale} onChange={e => setLocale(e.target.value as Locale)}><option value="en">English</option><option value="bn">বাংলা</option><option value="hi">हिन्दी</option></select></label><Button className="header-add" onClick={() => ensureUser(() => setAddOpen(true))}>＋ {t('add')}</Button></div></header>
    <main className="page-shell">
      <section className="intro"><div className="eyebrow"><span className="location-dot"/> {t('city')}</div><h1>{t('headline')}</h1><p>{t('intro')}</p></section>
      <section className="needs" aria-label={t('nearby')}>
        {([{type:'toilet', key:'toilet',sub:'toiletSub',filter:'toilet'},{type:'dustbin',key:'bin',sub:'binSub',filter:'bins'},{type:'ewaste',key:'electronics',sub:'electronicsSub',filter:'ewaste'}] as const).map(n => <button key={n.key} className={`need-card need-${n.type} ${filter === n.filter ? 'need-active' : ''}`} aria-pressed={filter === n.filter} onClick={() => choose(n.filter)}><span className="need-symbol"><Icon type={n.type} size={34}/></span><span><strong>{t(n.key)}</strong><small>{t(n.sub)}</small></span><span className="need-arrow"><Icon type="arrow" size={20}/></span></button>)}
      </section>
      <section className="search-area"><label className="search-box"><Icon type="search" size={22}/><span className="sr-only">{t('search')}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('placeholder')} type="search"/>{query && <button className="clear-search" aria-label={t('clear')} onClick={() => setQuery('')}>×</button>}</label><div className="quick-items">{['phone-charger','plastic-bottle','old-phone','aa-battery'].map(id => { const i = items.find(i => i.id === id); return i ? <button key={id} onClick={() => setQuery(itemText(i, locale).aliases[0] || itemText(i, locale).name)}>{itemText(i, locale).aliases[0] || itemText(i, locale).name}</button> : null; })}</div></section>
      {demoMode && <div className="demo-banner">{t('demo')}</div>}
      <div className="notice-region" aria-live="polite">{notice && <p className="notice">{t(notice as CopyKey)}</p>}</div>
      {query.trim() && <section className="item-answer" aria-live="polite">{item ? <><div className="answer-main"><span className="category-label">{t(item.category as CopyKey)}</span><h2>{itemText(item, locale).name}</h2><p>{itemText(item, locale).tip}</p>{matches.length > 1 && <div className="quick-items">{matches.slice(1).map(i => <button key={i.id} onClick={() => setQuery(itemText(i, locale).name)}>{itemText(i, locale).name}</button>)}</div>}</div><div className="answer-place"><span className="eyebrow">{t('selected')}</span>{destination ? <><strong>{destination.name}</strong><span>{distance(destination)} · {origin ? t('yourDistance') : t('centre')}</span><p>{t('caution')}</p><a className="button" href={directionUrl(destination)} target="_blank" rel="noreferrer">{t('directions')} ↗</a></> : <><strong>{t('empty')}</strong><p>{t('noPublic')}</p><Button className="secondary" onClick={() => ensureUser(() => setAddOpen(true))}>{t('add')}</Button></>}</div></> : <><div><h2>{t('unknown')}</h2><p>{t('unknownHelp')}</p><div className="chips">{['ewaste','dry','wet','sanitary_medical','hazardous'].map(c => <button key={c} onClick={() => { const i = items.find(i => i.category === c); if (i) setQuery(itemText(i, locale).name); }}>{t(c as CopyKey)}</button>)}</div></div></>}</section>}
      <section id="results" className="results-section"><div className="results-heading"><div><span className="eyebrow">KOLKATA · {t('onlineOnly')}</span><h2>{t('nearby')} <span className="result-count">{new Intl.NumberFormat(locale).format(visible.length)}</span></h2></div><Button className="secondary location-button" onClick={locate} disabled={locating} aria-busy={locating}><Icon type="pin" size={18}/>{locating ? t('locating') : t('locate')}</Button></div>
        <div className="results-toolbar"><div className="chips">{(['all', ...types] as const).map(f => <button className={filter === f ? 'chip-active' : ''} key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? t('all') : t(typeKeys[f])}</button>)}</div><div className="view-switch"><button aria-pressed={view === 'list'} onClick={() => setView('list')}>{t('list')}</button><button aria-pressed={view === 'map'} onClick={() => setView('map')}>{t('map')}</button></div></div>
        <div className={`results-grid mobile-${view}`}><div className="results-list"><p className="distance-origin">{origin ? t('yourDistance') : t('centre')}</p>{loading ? <div className="empty-state" role="status"><span className="loader"/>{t('loading')}</div> : loadError ? <div className="empty-state" role="alert"><h3>{errorText(locale, loadError)}</h3><Button onClick={() => void load()}>{t('retry')}</Button></div> : visible.length ? <><div className="place-list">{visible.slice(0, limit).map(placeRow)}</div>{limit < visible.length && <Button className="secondary load-more" onClick={() => setLimit(n => n + 8)}>{t('loadMore')}</Button>}</> : <div className="empty-state"><Icon type="pin" size={36}/><h3>{t('empty')}</h3><p>{t('emptyHelp')}</p><Button onClick={() => ensureUser(() => setAddOpen(true))}>＋ {t('add')}</Button></div>}</div><div className="results-map"><CivicMap places={visible} selected={selected} origin={origin} onSelect={pick} locale={locale}/><div className="map-legend">{types.map(type => <span key={type}><i className={`legend-dot type-${type}`}/>{t(typeKeys[type])}</span>)}</div></div></div>
      </section>
      <section className="community-strip"><span className="community-mark"><Icon type="pin" size={30}/></span><div><h2>{t('emptyHelp')}</h2><p>{t('footer')}</p></div><Button onClick={() => ensureUser(() => setAddOpen(true))}>＋ {t('add')}</Button></section>
      <footer><span>kahaan. · Kolkata</span><span>{t('onlineOnly')}</span>{user && <Button className="text-button" onClick={() => void api.logout().then(() => setUser(null)).catch(() => setNotice('auth_error'))}>{t('signOut')} · {user}</Button>}</footer>
    </main>
    {detailOpen && selected && <Dialog title={selected.name} locale={locale} onClose={() => setDetailOpen(false)}><div className="detail-type"><span className={`place-icon type-${selected.type}`}><Icon type={selected.type}/></span><span>{t(typeKeys[selected.type])} · {distance(selected)}</span></div><Status place={selected} locale={locale}/>{selected.note && <p>{selected.note}</p>}<p className="subtle">{t('caution')}</p>{selected.approximate && <p className="subtle">{t('approximate')}</p>}<div className="vote-counts"><span>{selected.confirmCount} {t('confirms')}</span><span>{selected.reportCount} {t('reports')}</span></div>{selected.sourceUrl && <a className="source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">{t('source')} ↗ · {selected.researchDate || selected.sourceUpdatedAt?.slice(0, 10)}</a>}<p className="form-error" role="alert">{voteError && errorText(locale, voteError)}</p><div className="detail-actions"><a className="button" href={directionUrl(selected)} target="_blank" rel="noreferrer">{t('directions')} ↗</a><Button className="secondary" disabled={voteBusy} aria-busy={voteBusy} onClick={() => ensureUser(() => { setDetailOpen(true); void vote(selected, 'confirm'); })}>{voteBusy ? t('saving') : t('confirm')}</Button><Button className="text-button" disabled={voteBusy} onClick={() => ensureUser(() => { setDetailOpen(false); setVoteError(''); setReportOpen(true); })}>{t('report')}</Button></div></Dialog>}
    {authOpen && <AuthDialog locale={locale} onClose={() => { pending.current = null; setAuthOpen(false); }} onSuccess={name => { setUser(name); setAuthOpen(false); const action = pending.current; pending.current = null; action?.(); }}/>} 
    {addOpen && <AddDialog locale={locale} places={places} origin={origin} onClose={() => setAddOpen(false)} onSaved={p => { update(p); setFilter('all'); setQuery(''); setAddOpen(false); setNotice('saved'); setDetailOpen(true); }}/>} 
    {reportOpen && selected && <ReportDialog locale={locale} busy={voteBusy} error={voteError} onClose={() => setReportOpen(false)} onSave={reason => void vote(selected, 'report', reason)}/>}
  </>;
}

function AuthDialog({ locale, onClose, onSuccess }: { locale: Locale; onClose: () => void; onSuccess: (name: string) => void }) {
  const t = (key: CopyKey) => text(locale, key);
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login'), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [code, setCode] = useState('');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [reveal, setReveal] = useState(false), [info, setInfo] = useState('');
  const form = useRef<HTMLFormElement>(null);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return; setError('');
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('invalid_email'); form.current?.querySelector<HTMLInputElement>('[name=email]')?.focus(); return; }
    if (mode !== 'verify' && (password.length < 8 || (mode === 'register' && !(/\d/.test(password) && /[a-z]/.test(password) && /[A-Z]/.test(password))))) { setError('invalid_password'); form.current?.querySelector<HTMLInputElement>('[name=password]')?.focus(); return; }
    if (mode === 'verify' && !code.trim()) { setError('code_required'); return; }
    setBusy(true);
    try {
      if (mode === 'login') onSuccess(await api.login(email.trim(), password));
      else if (mode === 'register') { await api.register(email.trim(), password); setMode('verify'); setInfo('verifySent'); setPassword(''); }
      else { await api.verify(email.trim(), code.trim()); setMode('login'); setInfo(''); }
    } catch { setError('auth_error'); } finally { setBusy(false); }
  }
  return <Dialog title={t('signIn')} locale={locale} onClose={busy ? () => {} : onClose}><p>{t('authHelp')}</p>{demoMode ? <><p className="demo-banner">{t('demo')}</p><p>{t('demoUser')}</p><div className="demo-users">{['Asha', 'Rahul', 'Mira'].map(name => <Button key={name} disabled={busy} onClick={async () => { setBusy(true); try { onSuccess(await api.loginDemo(`demo-${name.toLowerCase()}`)); } catch (error) { setError(errorCode(error)); } finally { setBusy(false); } }}>{name}</Button>)}</div></> : authConfigured ? <form ref={form} noValidate onSubmit={submit}><Field label={t('email')} error={error === 'invalid_email' ? t('invalid_email') : ''}><input name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={error === 'invalid_email'}/></Field>{mode === 'verify' ? <Field label={t('code')}><input autoComplete="one-time-code" inputMode="numeric" value={code} onChange={e => setCode(e.target.value)}/></Field> : <Field label={t('password')} error={error === 'invalid_password' ? t('invalid_password') : ''}><div className="password-field"><input name="password" type={reveal ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} aria-invalid={error === 'invalid_password'}/><button type="button" onClick={() => setReveal(!reveal)} aria-pressed={reveal}>{t(reveal ? 'hidePassword' : 'showPassword')}</button></div></Field>}<p className="form-error" role="alert">{error && errorText(locale, error)}</p><p role="status">{info && t(info as CopyKey)}</p><Button type="submit" disabled={busy} aria-busy={busy}>{busy ? t('saving') : t(mode === 'login' ? 'signIn' : mode === 'register' ? 'signUp' : 'verify')}</Button><Button className="text-button" type="button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }}>{t(mode === 'login' ? 'signUp' : 'signIn')}</Button></form> : <p role="alert">{t('setup')}</p>}{demoMode && error && <p className="form-error" role="alert">{errorText(locale, error)}</p>}</Dialog>;
}

function AddDialog({ locale, places, origin, onClose, onSaved }: { locale: Locale; places: Place[]; origin: Point | null; onClose: () => void; onSaved: (p: Place) => void }) {
  const t = (key: CopyKey) => text(locale, key);
  const [name, setName] = useState(''), [type, setType] = useState<PlaceType>('ewaste'), [note, setNote] = useState('');
  const [lat, setLat] = useState(origin ? String(origin.lat) : ''), [lng, setLng] = useState(origin ? String(origin.lng) : '');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const pin = lat.trim() && lng.trim() && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? { lat: Number(lat), lng: Number(lng) } : null;
  function setPin(p: Point) { setLat(p.lat.toFixed(6)); setLng(p.lng.toFixed(6)); setError(''); }
  function myLocation() { navigator.geolocation?.getCurrentPosition(p => setPin({lat:p.coords.latitude,lng:p.coords.longitude}), () => setError('locationError'), {timeout:10000}); }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return; setError('');
    const body = {name,type,note,lat:Number(lat),lng:Number(lng)};
    try { if (!lat.trim() || !lng.trim()) throw new ApiError('pinRequired'); validatePlace(body, area.bbox); }
    catch (error) { const code = error instanceof Error ? error.message : 'invalid_input'; setError(code); const field = code === 'invalid_name' ? 'name' : code === 'invalid_note' ? 'note' : 'lat'; form.current?.querySelector<HTMLElement>(`[name=${field}]`)?.focus(); return; }
    setBusy(true);
    try { onSaved(await api.create(body)); } catch (error) { setError(errorCode(error)); } finally { setBusy(false); }
  }
  return <Dialog title={t('add')} locale={locale} onClose={busy ? () => {} : onClose}><form ref={form} noValidate onSubmit={submit}><p>{t('pin')}</p><div className="add-map"><CivicMap places={places} pin={pin} onPin={setPin} locale={locale}/></div><Button className="secondary" type="button" onClick={myLocation}>{t('locate')}</Button><div className="coordinates"><Field label={t('lat')}><input name="lat" inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)} aria-invalid={['outside_area','pinRequired'].includes(error)}/></Field><Field label={t('lng')}><input name="lng" inputMode="decimal" value={lng} onChange={e => setLng(e.target.value)} aria-invalid={['outside_area','pinRequired'].includes(error)}/></Field></div><Field label={t('type')}><select value={type} onChange={e => setType(e.target.value as PlaceType)}>{types.map(type => <option value={type} key={type}>{t(typeKeys[type])}</option>)}</select></Field><Field label={t('name')} error={error === 'invalid_name' ? t('invalid_name') : ''}><input name="name" value={name} maxLength={80} onChange={e => setName(e.target.value)} aria-invalid={error === 'invalid_name'}/></Field><Field label={t('note')}><Textarea className="resize-none" name="note" rows={3} maxLength={200} value={note} onChange={e => setNote(e.target.value)}/></Field><p className="form-error" role="alert">{error && errorText(locale, error)}</p><div className="form-actions"><Button type="submit" disabled={busy} aria-busy={busy}>{busy ? t('saving') : t('save')}</Button><Button className="secondary" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</Button></div></form></Dialog>;
}
function ReportDialog({locale,busy,error,onClose,onSave}:{locale:Locale;busy:boolean;error:string;onClose:()=>void;onSave:(s:string)=>void}) {
  const [reason,setReason] = useState('');
  return <Dialog title={text(locale,'report')} locale={locale} onClose={busy ? ()=>{} : onClose}><form noValidate onSubmit={e=>{e.preventDefault();if(!busy)onSave(reason);}}><Field label={text(locale,'reason')}><Textarea className="resize-none" rows={4} maxLength={200} value={reason} onChange={e=>setReason(e.target.value)}/></Field><p className="form-error" role="alert">{error&&errorText(locale,error)}</p><div className="form-actions"><Button type="submit" disabled={busy} aria-busy={busy}>{text(locale,busy?'saving':'report')}</Button><Button className="secondary" type="button" disabled={busy} onClick={onClose}>{text(locale,'cancel')}</Button></div></form></Dialog>;
}
