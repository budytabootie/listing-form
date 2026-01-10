// public/admin/js/core/navigation.js

export const filterMenuByRoleId = (permissions) => {
  if (!permissions) return;

  document.querySelectorAll(".menu-item").forEach((el) => {
    const action = el.getAttribute("onclick") || "";
    const match = action.match(/'([^']+)'/);

    if (match) {
      const pageName = match[1];

      // Cek langsung ke data JSON dari database
      if (pageName === "profile" || permissions[pageName] === true) {
        el.style.display = "flex";
      } else {
        el.style.display = "none";
      }
    }
  });
};
