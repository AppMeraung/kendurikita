import { BudgetItem, ChecklistItem, Guest } from './domain';

export const modules = [
  { key: 'checklist', title: 'Checklist', icon: '✓', subtitle: '12 tugasan aktif' },
  { key: 'budget', title: 'Bajet', icon: 'RM', subtitle: 'Pantau perbelanjaan' },
  { key: 'invite', title: 'Kad Jemputan', icon: '✉', subtitle: 'Kad digital & QR' },
  { key: 'rsvp', title: 'RSVP', icon: '⌁', subtitle: 'Status kehadiran' },
  { key: 'seating', title: 'Pelan Meja', icon: '◉', subtitle: 'Susun tetamu' },
  { key: 'schedule', title: 'Atur Cara', icon: '◷', subtitle: 'Timeline majlis' },
  { key: 'team', title: 'Pasukan', icon: '♟', subtitle: 'PIC & keluarga' },
  { key: 'payments', title: 'Bayaran', icon: '▣', subtitle: 'Deposit & invois' },
  { key: 'documents', title: 'Dokumen', icon: '▤', subtitle: 'Kontrak & resit' },
  { key: 'items', title: 'Barang', icon: '◇', subtitle: 'Inventori majlis' },
  { key: 'reports', title: 'Laporan', icon: '↗', subtitle: 'Ringkasan lengkap' },
  { key: 'postevent', title: 'Selepas Majlis', icon: '★', subtitle: 'Arkib & ucapan' },
];

export const initialChecklist: ChecklistItem[] = [
  { id: '1', title: 'Sahkan tempahan dewan', due: 'Hari ini', done: false, priority: 'Tinggi' },
  { id: '2', title: 'Bayar deposit jurugambar', due: '31 Okt', done: false, priority: 'Tinggi' },
  { id: '3', title: 'Pilih menu katering', due: '3 Nov', done: true, priority: 'Sederhana' },
  { id: '4', title: 'Semak senarai tetamu keluarga', due: '5 Nov', done: false, priority: 'Sederhana' },
  { id: '5', title: 'Tempah busana pengantin', due: 'Selesai', done: true, priority: 'Tinggi' },
  { id: '6', title: 'Hantar kad jemputan digital', due: '10 Nov', done: false, priority: 'Sederhana' },
];

export const initialBudget: BudgetItem[] = [
  { id: '1', category: 'Dewan & kanopi', planned: 12000, spent: 8000 },
  { id: '2', category: 'Katering', planned: 15000, spent: 7500 },
  { id: '3', category: 'Busana & kecantikan', planned: 6500, spent: 4200 },
  { id: '4', category: 'Foto & video', planned: 5500, spent: 2000 },
  { id: '5', category: 'Dekorasi & pelamin', planned: 8000, spent: 3500 },
  { id: '6', category: 'Lain-lain', planned: 3000, spent: 300 },
];

export const initialGuests: Guest[] = [
  { id: '1', name: 'Encik Rahman & keluarga', group: 'Keluarga Pengantin Lelaki', pax: 5, rsvp: 'Hadir' },
  { id: '2', name: 'Puan Salmah', group: 'Keluarga Pengantin Perempuan', pax: 2, rsvp: 'Hadir' },
  { id: '3', name: 'Aiman Hakim', group: 'Rakan', pax: 1, rsvp: 'Menunggu' },
  { id: '4', name: 'Siti Mariam & keluarga', group: 'Rakan', pax: 4, rsvp: 'Hadir' },
  { id: '5', name: 'Dr. Farid', group: 'VIP', pax: 2, rsvp: 'Tidak hadir' },
  { id: '6', name: 'Keluarga Pak Long', group: 'Keluarga Pengantin Lelaki', pax: 6, rsvp: 'Menunggu' },
];

export const vendors = [
  { id: '1', name: 'Seri Anggun Catering', category: 'Katering', location: 'Shah Alam', rating: 4.9, price: 'RM18/pax', badge: 'Pilihan Ramai', icon: '🍽️' },
  { id: '2', name: 'Lensa Kasih Studio', category: 'Foto & Video', location: 'Petaling Jaya', rating: 4.8, price: 'Dari RM2,800', badge: 'Disahkan', icon: '📷' },
  { id: '3', name: 'Mahligai Event Hall', category: 'Dewan', location: 'Bangi', rating: 4.7, price: 'Dari RM6,500', badge: 'Pakej Lengkap', icon: '🏛️' },
  { id: '4', name: 'Seroja Bridal', category: 'Busana', location: 'Ampang', rating: 4.9, price: 'Dari RM1,900', badge: 'Terlaris', icon: '👗' },
];

export const timeline = [
  ['10:00 pagi', 'Ketibaan keluarga & vendor'],
  ['11:30 pagi', 'Ketibaan pengantin'],
  ['12:00 tengah hari', 'Jamuan makan bermula'],
  ['1:30 petang', 'Sesi bergambar keluarga'],
  ['4:00 petang', 'Majlis tamat & penutupan'],
];
