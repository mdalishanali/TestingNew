export const visibilityPlugin = (schema) => {
  schema.path('isDeleted', { type: Boolean, default: false });
  schema.path('isVisible', { type: Boolean, default: true });

  schema
    .pre('count', addFiltersIfNotPresent)
    .pre('find', addFiltersIfNotPresent)
    .pre('findOne', addFiltersIfNotPresent)
    .pre('update', addFiltersIfNotPresent)
    .pre('findOneAndUpdate', addFiltersIfNotPresent);
};

function addFiltersIfNotPresent(next) {
  if (this.options && this.options.getDeleted) {
    next();
    return;
  }

  if (this.options && this.options.skipVisibility) {
    this._conditions.isDeleted = false;
    next();
    return;
  }

  if (typeof this._conditions.isVisible === 'undefined') {
    this._conditions.isVisible = true;
  }

  if (typeof this._conditions.isDeleted === 'undefined') {
    this._conditions.isDeleted = false;
  }

  next();
}