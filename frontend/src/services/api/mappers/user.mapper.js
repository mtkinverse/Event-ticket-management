export const mapUser = (raw) => ({
  id: raw.id,
  email: raw.email,
  name: raw.name,
  role: raw.role,
  phone: raw.phone || null,
  createdAt: raw.createdAt,
  initials: raw.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
});

export const mapUserList = (rawArr) => rawArr.map(mapUser);
