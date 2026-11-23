(function () {
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.tagName === 'A') nav.classList.remove('is-open');
    });
  }

  // Минимальная дата записи — сегодня
  var dateInput = document.querySelector('#preferred_date');
  if (dateInput) {
    var today = new Date();
    var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.min = iso;
  }

  // Плавная подсветка ошибок формы
  var invalid = document.querySelector('.alert--error');
  if (invalid) {
    window.scrollTo({ top: invalid.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
  }
})();
