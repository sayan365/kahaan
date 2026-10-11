import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import Fuse from 'fuse.js';
import { api, ApiError, authConfigured, demoMode } from './api';
import { text, errorText, type CopyKey } from './i18n';
import { Button, Dialog, Field, Icon, Status, Textarea, PlacePanel } from './components';
import { CivicMap } from './Map';
import { haversine, insideArea, nearestDestination, validatePlace } from '../../backend/src/lib/domain.mjs';
import area from '../../data/area.json';
import { readRoute, routeHash, type Route, type Screen, type Filter } from './navigation';
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
  const [loading, setLoading] = useState(true), [loadError, setLoadError] = useState('');
  const [route, setRoute] = useState<Route>(() => readRoute(window.location.hash));
  const { screen, filter, query } = route;
  const setQuery = (query: string) => { setDetailOpen(false); setSelected(null); setRoute(old => ({ ...old, query })); };
  const setFilter = (filter: Filter) => { setDetailOpen(false); setSelected(null); setRoute(old => ({ ...old, filter, query: '' })); };
  const [view, setView] = useState<'list' | 'map'>('map');
  const screenHeading = useRef<HTMLHeadingElement>(null);
  function navigate(screen: Screen, changes: Partial<Route> = {}) {
    const next = { ...route, ...changes, screen };
    if (routeHash(next) !== window.location.hash) window.history.pushState(null, '', routeHash(next));
    setRoute(next); setDetailOpen(false); setSelected(null); window.scrollTo({ top: 0, behavior: 'instant' });
  }
  useEffect(() => {
    const restore = () => { setRoute(readRoute(window.location.hash)); setDetailOpen(false); setSelected(null); };
    window.addEventListener('popstate', restore); window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('popstate', restore); window.removeEventListener('hashchange', restore); };
  }, []);
  useEffect(() => { window.history.replaceState(null, '', routeHash(route)); }, [screen, filter, query]);
  useEffect(() => { screenHeading.current?.focus({ preventScroll: true }); }, [screen]);
  useEffect(() => { document.title = `${text(locale, screen === 'nearby' ? 'nearbyNav' : screen === 'guide' ? 'guide' : 'start')} · Kahaan`; }, [screen, locale]);
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
  const visible = useMemo(() => places.filter(p => (filter === 'all' || (filter === 'bins' ? ['dustbin', 'recycling'].includes(p.type) : p.type === filter)) && (!item || (item.placeTypes.includes(p.type) && (!p.acceptedItemIds || p.acceptedItemIds.includes(item.id))))).sort((a, b) => haversine(position, a) - haversine(position, b)), [places, filter, origin, item]);
  const distance = (p: Point) => { const m = haversine(position, p); return m < 1000 ? `${new Intl.NumberFormat(locale).format(Math.round(m / 10) * 10)} m` : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(m / 1000)} km`; };
  function choose(f: Filter) { setNotice(''); navigate('nearby', { filter: f, query: '' }); }
  function ensureUser(action: () => void) { if (user) action(); else { pending.current = action; setDetailOpen(false); setAuthOpen(true); } }
  function switchView(next: 'list' | 'map') { setDetailOpen(false); setSelected(null); setView(next); }
  function pick(place: Place) { setView('map'); setSelected(place); setVoteError(''); setDetailOpen(true); }
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
  const sourceLabel = (place: Place) => t(place.source === 'osm' ? 'sourceOsm' : place.source === 'user' ? 'sourceCommunity' : 'sourcePublished');
  function placeRow(place: Place) { return <button key={place.placeId} className={`place-row ${selected?.placeId === place.placeId ? 'is-selected' : ''}`} onClick={() => pick(place)}><span className={`place-icon type-${place.type}`}><Icon type={place.type}/></span><span className="place-body"><span className="place-row-top"><strong>{place.name}</strong><span className="place-distance">{distance(place)}{place.approximate ? ' ≈' : ''}</span></span><span className="place-meta">{t(typeKeys[place.type])} · {sourceLabel(place)}</span><span className="place-trust"><Status place={place} locale={locale}/>{place.recommendable === false && <span className="access-note">{t('callFirst')}</span>}</span></span><span className="row-arrow" aria-hidden="true">↗</span></button>; }
  function searchBox(home = false) { return <form className={`search-area ${home ? 'home-search' : ''}`} noValidate onSubmit={e => { e.preventDefault(); navigate('nearby', {filter:'all'}); }}><label className="search-box"><Icon type="search" size={21}/><span className="sr-only">{t('search')}</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('placeholder')} type="search"/>{query && <button type="button" className="clear-search" aria-label={t('clear')} onClick={e => {setQuery('');e.currentTarget.parentElement?.querySelector('input')?.focus();}}>×</button>}{home && <Button type="submit" className="search-submit"><Icon type="arrow" size={20}/><span className="sr-only">{t('searchAction')}</span></Button>}</label><div className="quick-items">{['phone-charger','plastic-bottle','old-phone','aa-battery'].map(id => { const i = items.find(i => i.id === id); return i ? <button type="button" key={id} onClick={() => navigate('nearby', {query:itemText(i, locale).aliases[0] || itemText(i, locale).name,filter:'all'})}>{itemText(i, locale).aliases[0] || itemText(i, locale).name}</button> : null; })}</div></form>; }
  function placeDetails(selected: Place) { return <><div className="detail-type"><span className={`place-icon type-${selected.type}`}><Icon type={selected.type}/></span><span>{t(typeKeys[selected.type])} · {distance(selected)}</span></div><Status place={selected} locale={locale}/><h3 className="section-label">{t('beforeGo')}</h3>{selected.note && <p className="facility-note">{selected.note}</p>}<p className="subtle">{t('caution')}</p>{selected.approximate && <p className="subtle">{t('approximate')}</p>}{selected.sourceUrl && <a className="source-link" href={selected.sourceUrl} target="_blank" rel="noreferrer">{t('source')} ↗ · {selected.researchDate || selected.sourceUpdatedAt?.slice(0, 10)}</a>}<details className="community-details"><summary>{t('communityChecks')}</summary><div className="vote-counts"><span>{selected.confirmCount} {t('confirms')}</span><span>{selected.reportCount} {t('reports')}</span></div><p className="subtle">{t('trustHelp')}</p></details><p className="form-error" role="alert">{voteError && errorText(locale, voteError)}</p></>; }
  function placeActions(selected: Place) { return <div className="detail-actions"><a className="button" href={directionUrl(selected)} target="_blank" rel="noreferrer">{t('directions')} ↗</a><Button className="secondary" disabled={voteBusy} aria-busy={voteBusy} onClick={() => ensureUser(() => { setDetailOpen(true); void vote(selected, 'confirm'); })}>{voteBusy ? t('saving') : t('confirm')}</Button><Button className="text-button" disabled={voteBusy} onClick={() => ensureUser(() => { setDetailOpen(false); setVoteError(''); setReportOpen(true); })}>{t('report')}</Button></div>; }
  const nav = <>{(['start','nearby','guide'] as const).map(page => <a key={page} href={routeHash({...route, screen:page})} aria-current={screen === page ? 'page' : undefined} onClick={e => {e.preventDefault();navigate(page);}}>{t(page === 'nearby' ? 'nearbyNav' : page)}</a>)}</>;
  return <>
    <a className="skip-link" href="#main-content" onClick={e => {e.preventDefault();screenHeading.current?.focus();}}>{t('skipContent')}</a>
    <header className={`site-header ${screen === 'nearby' ? 'map-header' : ''}`}><a className="brand" href="#/start" aria-label="Kahaan" onClick={e => {e.preventDefault();navigate('start');}}><span className="brand-mark"><Icon type="pin" size={23}/></span>kahaan<span className="brand-dot">.</span></a><nav className="desktop-nav" aria-label={t('navigation')}>{nav}</nav><div className="header-actions"><label className="locale-control"><span className="sr-only">{t('language')}</span><select aria-label={t('language')} value={locale} onChange={e => setLocale(e.target.value as Locale)}><option value="en">English</option><option value="bn">বাংলা</option><option value="hi">हिन्दी</option></select></label>{screen === 'nearby' && user && <Button className="text-button map-signout" onClick={() => void api.logout().then(() => setUser(null)).catch(() => setNotice('auth_error'))}>{t('signOut')}</Button>}<Button className="header-add" aria-label={t('add')} onClick={() => ensureUser(() => setAddOpen(true))}><span aria-hidden="true">+</span><span className="add-label">{t('add')}</span></Button></div></header>
    <main id="main-content" className={`page-shell screen-${screen} ${screen === "nearby" ? `browse-${view}` : ""}`}>
      <div className="notice-region" aria-live="polite">{notice && <p className="notice">{t(notice as CopyKey)}</p>}</div>
      {screen === 'start' && loadError && <div className="home-load-error" role="alert"><p>{errorText(locale, loadError)}</p><Button className="secondary" onClick={() => void load()}>{t('retry')}</Button></div>}
      {screen === 'start' && <>
        <section className="home-grid"><div className="home-intro"><span className="eyebrow">{t('city')}</span><h1 ref={screenHeading} tabIndex={-1}>{t('heroLead')}<span>{t('heroAccent')}</span></h1><p className="hero-description">{t('startHelp')}</p><h2 className="section-label">{t('chooseNeed')}</h2><div className="needs">
          {([{type:'toilet', key:'toilet',sub:'toiletSub',filter:'toilet'},{type:'dustbin',key:'bin',sub:'binSub',filter:'bins'},{type:'ewaste',key:'electronics',sub:'electronicsSub',filter:'ewaste'}] as const).map(n => <button key={n.key} className={`need-card need-${n.type}`} onClick={() => choose(n.filter)}><span className="need-symbol"><Icon type={n.type} size={26}/></span><span><strong>{t(n.key)}</strong><small>{t(n.sub)}</small></span><span className="need-arrow"><Icon type="arrow" size={20}/></span></button>)}
        </div></div><div className="home-map"><div className="home-map-title"><span>{t('pilotShort')}</span><button className="plain-link" onClick={() => navigate('nearby')}>{t('browseAll')} ↗</button></div><CivicMap places={places} onSelect={p => {navigate('nearby');pick(p);}} locale={locale}/><div className="home-map-foot"><strong>{loading ? '—' : new Intl.NumberFormat(locale).format(places.length)}</strong><span>{t('catalogueCount')}</span><span className="map-coverage-note">{t('onlineOnly')}</span></div></div></section>
        <section className="home-search-section"><div><h2>{t('search')}</h2><p>{t('intro')}</p></div>{searchBox(true)}</section>
      </>}
      {screen === 'nearby' && <section className={`map-workspace workspace-${view} ${detailOpen ? 'has-detail' : ''}`} aria-label={t('nearbyNav')}>
        <h1 className="sr-only" ref={screenHeading} tabIndex={-1}>{t('nearbyNav')}</h1>
        <div className="workspace-map"><CivicMap immersive places={visible} selected={selected} origin={origin} onSelect={pick} locale={locale}/></div>
        <div className="map-toolbar">
          {searchBox()}
          <div className="chips map-filters">{(['all', ...types] as const).map(f => <button className={filter === f ? 'chip-active' : ''} key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? t('all') : t(typeKeys[f])}</button>)}</div>
          <label className="map-filter-select"><span className="sr-only">{t('type')}</span><select value={filter} onChange={e => setFilter(e.target.value as Filter)}>{(['all', 'bins', ...types] as const).map(f => <option key={f} value={f}>{f === 'all' ? t('all') : f === 'bins' ? t('bin') : t(typeKeys[f])}</option>)}</select></label>
          <Button className="secondary location-button" onClick={locate} disabled={locating} aria-busy={locating} aria-label={locating ? t('locating') : t('locate')}><Icon type="pin" size={18}/><span>{locating ? t('locating') : t('locate')}</span></Button>
          <div className="view-switch"><button aria-pressed={view === 'list'} onClick={() => switchView('list')}>{t('list')}</button><button aria-pressed={view === 'map'} onClick={() => switchView('map')}>{t('map')}</button></div>
        </div>
        {(view === "list" || query.trim() || loading || loadError) && <section id="results" className="map-results-panel" aria-labelledby="results-title">
          <div className="map-panel-heading"><div><span className="eyebrow">{t('pilotShort')}</span><h2 id="results-title">{t(filter === 'all' || filter === 'bins' ? 'nearby' : typeKeys[filter])} <span className="result-count">{new Intl.NumberFormat(locale).format(visible.length)}</span></h2></div><button className="sheet-toggle" aria-expanded={view === 'list'} onClick={() => switchView(view === 'list' ? 'map' : 'list')}>{t(view === 'list' ? 'map' : 'list')} <Icon type="arrow" size={16}/></button></div>
          <div className="map-panel-content">
            {query.trim() && <section className="item-answer" aria-live="polite">{item ? <><div className="answer-main"><span className="category-label">{t(item.category as CopyKey)}</span><h2>{itemText(item, locale).name}</h2><p>{itemText(item, locale).tip}</p>{matches.length > 1 && <div className="quick-items">{matches.slice(1).map(i => <button key={i.id} onClick={() => setQuery(itemText(i, locale).name)}>{itemText(i, locale).name}</button>)}</div>}</div><div className="answer-place"><span className="eyebrow">{t('selected')}</span>{destination ? <><strong>{destination.name}</strong><span>{distance(destination)} · {origin ? t('yourDistance') : t('centre')}</span><p>{t('caution')}</p><a className="button" href={directionUrl(destination)} target="_blank" rel="noreferrer">{t('directions')} ↗</a></> : <><strong>{t('empty')}</strong><p>{t('noPublic')}</p><Button className="secondary" onClick={() => ensureUser(() => setAddOpen(true))}>{t('add')}</Button></>}</div></> : <><div><h2>{t('unknown')}</h2><p>{t('unknownHelp')}</p><div className="chips">{['ewaste','dry','wet','sanitary_medical','hazardous'].map(c => <button key={c} onClick={() => { const i = items.find(i => i.category === c); if (i) setQuery(itemText(i, locale).name); }}>{t(c as CopyKey)}</button>)}</div></div></>}</section>}
            <p className="distance-origin">{origin ? t('yourDistance') : t('centre')}</p>{loading ? <div className="empty-state" role="status"><span className="loader"/>{t('loading')}</div> : loadError ? <div className="empty-state" role="alert"><h3>{errorText(locale, loadError)}</h3><Button onClick={() => void load()}>{t('retry')}</Button></div> : visible.length ? <><div className="place-list">{visible.slice(0, limit).map(placeRow)}</div>{limit < visible.length && <Button className="secondary load-more" onClick={() => setLimit(n => n + 8)}>{t('loadMore')}</Button>}</> : <div className="empty-state"><Icon type="pin" size={36}/><h3>{t('empty')}</h3><p>{t('emptyHelp')}</p><Button onClick={() => ensureUser(() => setAddOpen(true))}>＋ {t('add')}</Button></div>}
            {demoMode && <div className="demo-banner">{t('demo')}</div>}
          </div>
        </section>}
        {detailOpen && selected && <PlacePanel actions={placeActions(selected)} title={selected.name} locale={locale} onClose={() => setDetailOpen(false)}>{placeDetails(selected)}</PlacePanel>}
        <div className="workspace-legend">{types.map(type => <span key={type}><i className={`legend-dot type-${type}`}/>{t(typeKeys[type])}</span>)}</div>
      </section>}
      {screen === 'guide' && <section className="guide-page"><div className="guide-intro"><span className="eyebrow">{t('guide')}</span><h1 ref={screenHeading} tabIndex={-1}>{t('guideTitle')}</h1><p>{t('guideIntro')}</p><Button onClick={() => navigate('nearby')}>{t('browseAll')} <Icon type="arrow" size={18}/></Button></div><div className="guide-sections"><article><span className="guide-number" aria-hidden="true">01</span><div><h2>{t('sourcesTitle')}</h2><p>{t('sourcesHelp')}</p><p className="guide-caution">{t('caution')}</p></div></article><article><span className="guide-number" aria-hidden="true">02</span><div><h2>{t('communityChecks')}</h2><p>{t('trustHelp')}</p><div className="trust-examples">{(['unverified','verified','reported'] as const).map(status => <span key={status} className={`status status-${status}`}>{t(status)}</span>)}</div></div></article><article><span className="guide-number" aria-hidden="true">03</span><div><h2>{t('contributeTitle')}</h2><p>{t('contributeHelp')}</p><Button onClick={() => ensureUser(() => setAddOpen(true))}>+ {t('add')}</Button></div></article></div></section>}
      {screen !== 'nearby' && <>{demoMode && <div className="demo-banner">{t('demo')}</div>}
      <footer><span>kahaan. <span className="footer-location">Kolkata</span></span><button className="plain-link" onClick={() => navigate('guide')}>{t('onlineOnly')}</button>{user && <Button className="text-button" onClick={() => void api.logout().then(() => setUser(null)).catch(() => setNotice('auth_error'))}>{t('signOut')}</Button>}</footer></>}
    </main>
    <nav className="mobile-nav" aria-label={t('navigation')}>{nav}</nav>
    {detailOpen && selected && screen !== 'nearby' && <Dialog className="place-detail-dialog" title={selected.name} locale={locale} onClose={() => setDetailOpen(false)}>{placeDetails(selected)}{placeActions(selected)}</Dialog>}
    {authOpen && <AuthDialog locale={locale} onClose={() => { pending.current = null; setAuthOpen(false); }} onSuccess={name => { setUser(name); setAuthOpen(false); const action = pending.current; pending.current = null; action?.(); }}/>}
    {addOpen && <AddDialog locale={locale} places={places} origin={origin} onClose={() => setAddOpen(false)} onSaved={p => { navigate('nearby', {filter:'all',query:''}); update(p); setAddOpen(false); setNotice('saved'); setDetailOpen(true); }}/>}
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
    catch (error) { const code = error instanceof Error ? error.message : 'invalid_input'; setError(code); const field = code === 'invalid_name' ? 'name' : code === 'invalid_note' ? 'note' : 'lat'; const target = form.current?.querySelector<HTMLElement>(`[name=${field}]`); const disclosure = target?.closest('details'); if (disclosure) disclosure.open = true; target?.focus(); return; }
    setBusy(true);
    try { onSaved(await api.create(body)); } catch (error) { setError(errorCode(error)); } finally { setBusy(false); }
  }
  return <Dialog className="add-dialog" title={t('add')} locale={locale} onClose={busy ? () => {} : onClose}><form ref={form} noValidate onSubmit={submit}><p className="add-intro">{t('addHelp')}</p><div className="add-layout"><section><h3 className="section-label">{t('locationStep')}</h3><p className="subtle">{t('pin')}</p><div className="add-map"><CivicMap places={places} pin={pin} onPin={setPin} locale={locale}/></div><Button className="secondary" type="button" onClick={myLocation}>{t('locate')}</Button><details className="coordinate-disclosure"><summary>{t('manualCoordinates')}</summary><div className="coordinates"><Field label={t('lat')}><input name="lat" inputMode="decimal" value={lat} onChange={e => setLat(e.target.value)} aria-invalid={['outside_area','pinRequired'].includes(error)}/></Field><Field label={t('lng')}><input name="lng" inputMode="decimal" value={lng} onChange={e => setLng(e.target.value)} aria-invalid={['outside_area','pinRequired'].includes(error)}/></Field></div></details></section><section><h3 className="section-label">{t('detailsStep')}</h3><Field label={t('type')}><select value={type} onChange={e => setType(e.target.value as PlaceType)}>{types.map(type => <option value={type} key={type}>{t(typeKeys[type])}</option>)}</select></Field><Field label={t('name')} error={error === 'invalid_name' ? t('invalid_name') : ''}><input name="name" value={name} maxLength={80} onChange={e => setName(e.target.value)} aria-invalid={error === 'invalid_name'}/></Field><Field label={t('note')}><Textarea className="resize-none" name="note" rows={3} maxLength={200} value={note} onChange={e => setNote(e.target.value)}/></Field></section></div><p className="form-error" role="alert">{error && errorText(locale, error)}</p><div className="form-actions"><Button type="submit" disabled={busy} aria-busy={busy}>{busy ? t('saving') : t('save')}</Button><Button className="secondary" type="button" disabled={busy} onClick={onClose}>{t('cancel')}</Button></div></form></Dialog>;
}
function ReportDialog({locale,busy,error,onClose,onSave}:{locale:Locale;busy:boolean;error:string;onClose:()=>void;onSave:(s:string)=>void}) {
  const [reason,setReason] = useState('');
  return <Dialog title={text(locale,'report')} locale={locale} onClose={busy ? ()=>{} : onClose}><form noValidate onSubmit={e=>{e.preventDefault();if(!busy)onSave(reason);}}><Field label={text(locale,'reason')}><Textarea className="resize-none" rows={4} maxLength={200} value={reason} onChange={e=>setReason(e.target.value)}/></Field><p className="form-error" role="alert">{error&&errorText(locale,error)}</p><div className="form-actions"><Button type="submit" disabled={busy} aria-busy={busy}>{text(locale,busy?'saving':'report')}</Button><Button className="secondary" type="button" disabled={busy} onClick={onClose}>{text(locale,'cancel')}</Button></div></form></Dialog>;
}
