export const preventDeletePlugin = (schema) => {
  schema.path('isVisible', { type: Boolean, default: true });
  schema
    .pre("update", checkUserPermission)
    .pre("findOneAndUpdate", checkUserPermission)
    .pre("updateOne", checkUserPermission)
    .pre("findByIdAndUpdate", checkUserPermission);
};

function checkUserPermission(next) {
  if (
    this.options &&
    this.options.deleteOperation &&
    this.options.user &&
    this.options.user.roles === "Moderator"
  ) {
    return;
  }
  next();
  return;
}
