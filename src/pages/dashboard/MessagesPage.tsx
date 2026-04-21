import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, X, Mail, Clock, Trash2, Search } from 'lucide-react';
import { siteApi } from '../../api';
import type { ContactMessage } from '../../api/types';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SectionSpinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Logo } from '../../components/ui/Logo';
import { useToast } from '../../components/ui/Toast';
import { swal } from '../../lib/swal';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS: Record<ContactMessage['status'], 'blue' | 'green' | 'yellow'> = {
  new:    'blue',
  read:   'green',
  unread: 'yellow',
};

type StatusFilter = 'all' | 'new' | 'read' | 'unread';

export function MessagesPage() {
  const { error } = useToast();
  const { hasPermission } = useAuth();
  const canUpdateStatus = hasPermission('site_config.change_contactmessage');
  const canDelete       = hasPermission('site_config.delete_contactmessage');
  const [messages, setMessages]     = useState<ContactMessage[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<ContactMessage | null>(null);
  const [updating, setUpdating]     = useState<number | null>(null);
  const [deleting, setDeleting]     = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch]         = useState('');

  const load = () => {
    setLoading(true);
    siteApi.listMessages()
      .then(res => setMessages(res.data.results ?? (res.data as unknown as ContactMessage[])))
      .catch(() => error('Failed to load messages.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (msg: ContactMessage, status: ContactMessage['status']) => {
    setUpdating(msg.id);
    try {
      const res = await siteApi.updateMessageStatus(msg.id, status);
      const updated = res.data as ContactMessage;
      setMessages(prev => prev.map(m => m.id === msg.id ? updated : m));
      if (selected?.id === msg.id) setSelected(updated);
      swal.success('Status updated.');
    } catch {
      error('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (msg: ContactMessage) => {
    const ok = await swal.confirmDelete(`Delete message from "${msg.name}"?`);
    if (!ok) return;
    setDeleting(msg.id);
    try {
      await siteApi.deleteMessage(msg.id);
      setMessages(prev => prev.filter(m => m.id !== msg.id));
      if (selected?.id === msg.id) setSelected(null);
      swal.success('Message deleted.');
    } catch {
      error('Failed to delete message.');
    } finally {
      setDeleting(null);
    }
  };

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg);
    if (msg.status === 'new') handleStatusChange(msg, 'read');
  };

  const visible = useMemo(() => {
    let list = messages;
    if (statusFilter !== 'all') list = list.filter(m => m.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    }
    return list;
  }, [messages, statusFilter, search]);

  const counts: Record<StatusFilter, number> = {
    all:    messages.length,
    new:    messages.filter(m => m.status === 'new').length,
    unread: messages.filter(m => m.status === 'unread').length,
    read:   messages.filter(m => m.status === 'read').length,
  };

  const columns = [
    {
      key: 'status', header: 'Status',
      render: (m: ContactMessage) => <Badge label={m.status} color={STATUS_COLORS[m.status]} />,
    },
    {
      key: 'name', header: 'Sender',
      render: (m: ContactMessage) => (
        <div>
          <p className="font-medium text-earth-900 text-sm">{m.name}</p>
          <p className="text-xs text-earth-500">{m.email}</p>
        </div>
      ),
    },
    {
      key: 'subject', header: 'Subject',
      render: (m: ContactMessage) => (
        <span className="text-sm text-earth-700 line-clamp-1">{m.subject}</span>
      ),
    },
    {
      key: 'created_at', header: 'Received',
      render: (m: ContactMessage) => (
        <span className="text-xs text-earth-500 whitespace-nowrap">
          {new Date(m.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions', header: 'Actions',
      render: (m: ContactMessage) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openMessage(m)}
            className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Read
          </button>
          {canUpdateStatus && (
            <select
              value={m.status}
              disabled={updating === m.id}
              onChange={e => handleStatusChange(m, e.target.value as ContactMessage['status'])}
              className="text-xs border border-earth-200 rounded-lg px-2 py-1 bg-white text-earth-700 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-50"
            >
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
          )}
          {canDelete && (
            <button
              onClick={() => handleDelete(m)}
              disabled={deleting === m.id}
              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              title="Delete"
            >
              <Trash2 size={13} className="text-red-400" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Contact Messages</h1>
          <p className="text-sm text-earth-500 mt-0.5">{messages.length} messages received.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
            <input
              className="input pl-9 text-sm w-52"
              placeholder="Search sender, subject…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-earth-100 rounded-xl p-1 w-fit">
        {(['all', 'new', 'unread', 'read'] as StatusFilter[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-white text-earth-900 shadow-sm'
                : 'text-earth-500 hover:text-earth-700'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === s ? 'bg-primary-100 text-primary-700' : 'bg-earth-200 text-earth-500'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <SectionSpinner />
      ) : (
        <Table
          columns={columns}
          data={visible}
          keyField="id"
          emptyMessage="No messages found."
        />
      )}

      {/* Message detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-center pb-2 border-b border-earth-100">
              <Logo variant="dark" className="h-7 w-auto" />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-earth-900">{selected.name}</span>
                  <Badge label={selected.status} color={STATUS_COLORS[selected.status]} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-earth-500">
                  <Mail size={12} /><span>{selected.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-earth-400">
                  <Clock size={12} /><span>{new Date(selected.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-earth-50 rounded-xl px-4 py-3">
              <p className="text-xs text-earth-400 uppercase tracking-wide font-medium mb-0.5">Subject</p>
              <p className="text-sm font-semibold text-earth-900">{selected.subject}</p>
            </div>

            <div className="bg-white border border-earth-100 rounded-xl px-4 py-4">
              <p className="text-xs text-earth-400 uppercase tracking-wide font-medium mb-2">Message</p>
              <p className="text-sm text-earth-700 leading-relaxed whitespace-pre-wrap">{selected.message}</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-earth-500">Mark as:</span>
                {(['new', 'read', 'unread'] as ContactMessage['status'][]).map(s => (
                  <button
                    key={s}
                    disabled={updating === selected.id || selected.status === s}
                    onClick={() => handleStatusChange(selected, s)}
                    className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors disabled:opacity-40 ${
                      selected.status === s
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'border-earth-200 text-earth-600 hover:border-primary-400 hover:text-primary-600'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selected)}
                  disabled={deleting === selected.id}
                  className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 disabled:opacity-40"
                >
                  <Trash2 size={12} /> Delete
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-earth-400 hover:text-earth-700 flex items-center gap-1"
                >
                  <X size={13} /> Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
