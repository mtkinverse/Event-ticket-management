// modelOrGetter: Sequelize Model class or a zero-arg function returning one (lazy init).
export const createBaseRepo = (modelOrGetter) => {
  const getModel = typeof modelOrGetter === 'function' ? modelOrGetter : () => modelOrGetter;

  const findAll = (where = {}, opts = {}) =>
    getModel().findAll({ where, ...opts })
      .then(rows => rows.map(r => r.get({ plain: true })));

  const findOne = (where, opts = {}) =>
    getModel().findOne({ where, ...opts })
      .then(r => r ? r.get({ plain: true }) : null);

  const findById = (id, opts = {}) => findOne({ id }, opts);

  const insertBulk = (records, opts = {}) =>
    getModel().bulkCreate(records, { returning: true, ...opts })
      .then(rows => rows.map(r => r.get({ plain: true })));

  const insert = (data, opts = {}) => insertBulk([data], opts).then(r => r[0]);

  const updateBulk = (ids, data, opts = {}) =>
    getModel().update(data, { where: { id: ids }, ...opts })
      .then(() => findAll({ id: ids }));

  const updateById = (id, data, opts = {}) =>
    updateBulk([id], data, opts).then(r => r[0]);

  const deleteBulk = (ids, opts = {}) =>
    getModel().destroy({ where: { id: ids }, ...opts });

  const deleteById = (id, opts = {}) => deleteBulk([id], opts);

  const withTransaction = (fn) => getModel().sequelize.transaction(fn);

  return {
    findAll, findOne, findById,
    insertBulk, insert,
    updateBulk, updateById,
    deleteBulk, deleteById,
    withTransaction,
  };
};
