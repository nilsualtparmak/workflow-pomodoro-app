/**
 * FocusFlow – Motivasyon alıntıları
 */

const QUOTES = [
  { text: 'Başarı, küçük çabaların tekrarıdır.', author: 'Robert Collier' },
  { text: 'Odaklanmak, hayır demek demektir.', author: 'Steve Jobs' },
  { text: 'Bugün yapabileceğini yarına bırakma.', author: 'Benjamin Franklin' },
  { text: 'Disiplin, hedefler ile başarı arasındaki köprüdür.', author: 'Jim Rohn' },
  { text: 'Büyük işler, küçük adımlarla başlar.', author: 'Lao Tzu' },
  { text: 'Verimlilik asla tesadüf değildir.', author: 'Paul J. Meyer' },
  { text: 'Zamanını yönet, hayatını yönet.', author: 'Alan Lakein' },
  { text: 'Her pomodoro seni hedefine bir adım daha yaklaştırır.', author: 'FocusFlow' },
  { text: 'Mükemmellik bir eylem değil, bir alışkanlıktır.', author: 'Aristoteles' },
  { text: 'Konsantre ol. Derin çalış. Sonuç al.', author: 'Cal Newport' },
  { text: 'Yapılacaklar listesi değil, yapılanlar listesi oluştur.', author: 'FocusFlow' },
  { text: 'Sabır ve azim her zaman kazanır.', author: 'Esopo' }
];

const Quotes = {
  init() {
    this.displayRandom();
  },

  getRandom() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  },

  displayRandom() {
    const el = document.getElementById('motivational-quote');
    if (!el) return;

    const quote = this.getRandom();
    el.innerHTML = `
      <p>"${quote.text}"</p>
      <cite>— ${quote.author}</cite>
    `;
  }
};
