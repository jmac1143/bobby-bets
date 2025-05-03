
const users = [{"name": "Justin", "img": "avatars/justin.png"}, {"name": "Ryan", "img": "avatars/ryan.png"}, {"name": "JB", "img": "avatars/jb.png"}, {"name": "Fyola", "img": "avatars/fyola.png"}, {"name": "AK", "img": "avatars/ak.png"}, {"name": "Seth", "img": "avatars/seth.png"}, {"name": "Jimmy", "img": "avatars/jimmy.png"}, {"name": "Evan", "img": "avatars/evan.png"}, {"name": "Jonathan", "img": "avatars/jonathan.png"}, {"name": "Juice", "img": "avatars/juice.png"}, {"name": "Timmy", "img": "avatars/timmy.png"}, {"name": "Kyle", "img": "avatars/kyle.png"}];
let pinMap = {"Justin": "4732", "Ryan": "8042", "JB": "6204", "Fyola": "7293", "AK": "3471", "Seth": "1579", "Jimmy": "4590", "Evan": "9185", "Jonathan": "5710", "Juice": "8127", "Timmy": "2937", "Kyle": "6935"};
const grid = document.getElementById('identity-grid');
const modal = document.getElementById('pinModal');
const modalName = document.getElementById('modalName');
const pinInput = document.getElementById('pinInput');
let selectedUser = null;

users.forEach(user => {
  const card = document.createElement('div');
  card.classList.add('identity-card');
  card.innerHTML = `<img src="${user.img}" alt="${user.name}"><span>${user.name}</span>`;
  card.onclick = () => {
    selectedUser = user.name;
    modalName.textContent = `Welcome, ${user.name}`;
    pinInput.value = '';
    modal.classList.remove('hidden');
  };
  grid.appendChild(card);
});

document.getElementById('submitPin').onclick = () => {
  const entered = pinInput.value.trim();
  if (entered === pinMap[selectedUser]) {
    window.location.href = "bet.html?user=" + encodeURIComponent(selectedUser);
  } else {
    alert("Incorrect PIN");
  }
};

document.getElementById('cancelPin').onclick = () => {
  modal.classList.add('hidden');
};
