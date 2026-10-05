import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import { hasRole, useAuth } from '../auth'
import { Banner, Field, Pager, Pill } from '../components/ui'
import type { AuditLog, Page, Role, Setting, UserRow } from '../types'

export function SettingsPage() {
  const { user, refresh } = useAuth()
  const admin = hasRole(user, 'system_administrator')
  const [users, setUsers] = useState<Page<UserRow> | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [settings, setSettings] = useState<Setting[]>([])
  const [logs, setLogs] = useState<Page<AuditLog> | null>(null)
  const [pageNo, setPageNo] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '', status: 'active' })
  const [editing, setEditing] = useState<number | null>(null)
  const [error, setError] = useState<unknown>(null)

  function load(next = pageNo) {
    if (!admin) return
    api<Page<UserRow>>(`/users?page=${next}`).then(setUsers).catch(setError)
    api<Role[]>('/roles').then(setRoles).catch(setError)
    api<Setting[]>('/settings').then(setSettings).catch(setError)
    api<Page<AuditLog>>('/audit-logs?page=1').then(setLogs).catch(setError)
  }

  useEffect(() => { load(pageNo) }, [pageNo, admin])

  async function saveUser(event: FormEvent) {
    event.preventDefault()
    const body: Record<string, string | number> = {
      name: form.name,
      email: form.email,
      role_id: Number(form.role_id),
      status: form.status,
    }
    if (form.password) body.password = form.password
    try {
      if (editing) await api(`/users/${editing}`, { method: 'PUT', body: JSON.stringify(body) })
      else await api('/users', { method: 'POST', body: JSON.stringify(body) })
      setEditing(null)
      setForm({ name: '', email: '', password: '', role_id: '', status: 'active' })
      load()
      await refresh()
    } catch (err) { setError(err) }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault()
    try {
      const saved = await api<Setting[]>('/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: settings.map((row) => ({ key: row.key, value: row.value ?? '' })) }),
      })
      setSettings(saved)
    } catch (err) { setError(err) }
  }

  return (
    <section>
      <div className="page-head"><div><h1>Profile</h1><p>Your account comes from the signed-in Sanctum session.</p></div></div>
      <article className="card">
        <p><strong>{user?.name}</strong></p>
        <p>{user?.email}</p>
        <p>Role: {user?.role.name} <Pill value={user?.status} /></p>
        {!admin && <p className="muted">Account changes are made by a system administrator.</p>}
      </article>
      <Banner error={error} />
      {admin && (
        <>
          <div className="page-head" style={{ marginTop: 20 }}><div><h2>Users</h2></div></div>
          <form className="sheet" onSubmit={saveUser}>
            <div className="form-grid">
              <Field label="Name" name="name" error={error}><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Email" name="email" error={error}><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label={editing ? 'New password (optional)' : 'Password'} name="password" error={error}><input type="password" minLength={editing ? undefined : 8} required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
              <Field label="Role" name="role_id" error={error}>
                <select required value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
                  <option value="">Select role</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </Field>
              <Field label="Status" name="status" error={error}>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button type="submit">{editing ? 'Update user' : 'Create user'}</button>
              {editing && <button type="button" className="ghost" onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '', role_id: '', status: 'active' }) }}>Cancel</button>}
            </div>
          </form>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {users?.data.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td><td>{row.email}</td><td>{row.role?.name}</td><td><Pill value={row.status} /></td>
                    <td><button className="ghost" onClick={() => { setEditing(row.id); setForm({ name: row.name, email: row.email, password: '', role_id: String(row.role_id), status: row.status }) }}>Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={users} onPage={setPageNo} />
          <form className="sheet" onSubmit={saveSettings}>
            <h2>System settings</h2>
            {settings.length === 0 && <p className="muted">No settings stored yet. Add a key below, then save.</p>}
            {settings.map((row, index) => (
              <div className="form-grid" key={row.id ?? row.key}>
                <input value={row.key} onChange={(e) => setSettings(settings.map((item, i) => i === index ? { ...item, key: e.target.value } : item))} />
                <input value={row.value ?? ''} onChange={(e) => setSettings(settings.map((item, i) => i === index ? { ...item, value: e.target.value } : item))} />
              </div>
            ))}
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button type="button" className="ghost" onClick={() => setSettings([...settings, { id: 0, key: '', value: '' }])}>Add setting</button>
              <button type="submit">Save settings</button>
            </div>
          </form>
          <article className="card" style={{ marginTop: 12 }}>
            <h2>Recent audit log</h2>
            <ul>
              {logs?.data.slice(0, 8).map((log) => (
                <li key={log.id}>{log.created_at?.slice(0, 16).replace('T', ' ')} — {log.user?.name || 'System'} — {log.action} ({log.module})</li>
              ))}
              {logs?.data.length === 0 && <li className="muted">No audit entries yet.</li>}
            </ul>
          </article>
        </>
      )}
    </section>
  )
}
