import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { siteApi } from '../../api';
import type { ContactMessage } from '../../api/types';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';

const STATUS_COLORS: Record<ContactMessage['status'], string> = {
  new:    'blue',
  read:   'green',
  unread: 'yellow',
};

export function MessagesPage() {
  const { success, error } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

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
      setMessages(prev => prev.map(m => m.id === msg.id ? res.data : m));
      success('Status updated.');
    } catch {
      error('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const unread = messages.filter(m => m.status !== 'read').length;

  const columns = [
    {
      key: 'status',
      header: 'Status',
      render: (m: ContactMessage) => (
        <Badge color={STATUS_COLORS[m.status] as 'blue' | 'green' | 'yellow'}>
          {m.status}
        </Badge>
      ),
    },
    {
      key: 'name',
      header: 'Sender',
      render: (m: ContactMessage) => (
        <div>
          <p className="font-medium text-earth-900 text-sm">{m.name}</p>
          <p className="text-xs text-earth-500">{m.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (m: ContactMessage) => (
        <span className="text-sm text-earth-700 line-clamp-1">{m.subject}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Received',
      render: (m: ContactMessage) => (
        <span className="text-xs text-earth-500 whitespace-nowrap">
          {new Date(m.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m: ContactMessage) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(expanded === m.id ? null : m.id)}
            className="text-xs text-primary-600 hover:underline"
          >
            {expanded === m.id ? 'Hide' : 'Read'}
          </button>
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
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-earth-900">Contact Messages</h1>
          <p className="text-sm text-earth-500 mt-0.5">
            {messages.length} total · {unread} unread
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <Table
            columns={columns}
            data={messages}
            keyField="id"
            emptyMessage="No contact messages yet."
          />

          {expanded !== null && (() => {
            const msg = messages.find(m => m.id === expanded);
            if (!msg) return null;
            return (
              <div className="bg-white border border-earth-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-earth-900">{msg.subject}</p>
                    <p className="text-xs text-earth-500">
                      From {msg.name} &lt;{msg.email}&gt; · {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(null)}
                    className="text-earth-400 hover:text-earth-700 text-xs shrink-0"
                  >
                    Close
                  </button>
                </div>
                <p className="text-sm text-earth-700 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
