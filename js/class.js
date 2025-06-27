(() => {
  'use strict';

  // Базовый класс для UI-компонентов
  class UIComponent {
    constructor(element, defaultDisplay) {
      if (!element) {
        throw new Error('UIComponent: элемент не найден в DOM! Проверьте id и порядок загрузки скрипта.');
      }
      if (!(element instanceof HTMLElement)) {
        throw new TypeError('element должен быть HTMLElement');
      }
      this.element = element;
      let computed = window.getComputedStyle(this.element).display;
      this.defaultDisplay = defaultDisplay || (computed === 'none' ? 'block' : computed);
    }
    show() { this.element.style.display = this.defaultDisplay; }
    hide() { this.element.style.display = 'none'; }
    setText(text) { this.element.textContent = text; }
    setColor(color) { this.element.style.color = color; }
    setBg(bg) { this.element.style.backgroundImage = bg; }
    resetStyle() {
      this.element.style.color = '';
      this.element.style.backgroundImage = '';
    }
    focus() { this.element.focus(); }
    blur() { this.element.blur(); }
    addClass(cls) { this.element.classList.add(cls); }
    removeClass(cls) { this.element.classList.remove(cls); }
    addEventListener(event, handler) { this.element.addEventListener(event, handler); }
    removeEventListener(event, handler) { this.element.removeEventListener(event, handler); }
  }

  // Класс для модального окна алерта
  class AlertModal extends UIComponent {
    constructor(element, messageElement, btnElement, contentElement) {
      super(element, 'flex'); // Явно указываем display: flex для alert-modal
      this.messageElement = new UIComponent(messageElement);
      this.btnElement = new UIComponent(btnElement);
      this.contentElement = new UIComponent(contentElement, 'flex');
      this.isActive = false;
      this.currentType = null;
      this._onClose = null;
    }

    showAlert(message, type = 'info', onClose) {
      if (this.isActive) return;
      this.currentType = type;
      // Сначала убираем все alert-классы
      this.contentElement.removeClass('alert-win');
      this.contentElement.removeClass('alert-lose');
      this.contentElement.removeClass('alert-info');
      // Затем добавляем нужный
      if (type === 'win') {
        this.contentElement.addClass('alert-win');
      } else if (type === 'lose') {
        this.contentElement.addClass('alert-lose');
      } else {
        this.contentElement.addClass('alert-info');
      }
      this.messageElement.setText(message);
      this.show();
      setTimeout(() => {
        this.btnElement.focus();
      }, 100);
      this.isActive = true;
      this._onClose = onClose;
      this._closeModal = () => {
        this.hide();
        this.contentElement.removeClass('alert-win');
        this.contentElement.removeClass('alert-lose');
        this.contentElement.removeClass('alert-info');
        this.btnElement.blur();
        this.isActive = false;
        this.btnElement.removeEventListener('click', this._closeModal);
        this.element.removeEventListener('click', this._handleOutsideClick);
        this.element.removeEventListener('keydown', this._handleKeydown);
        if (typeof this._onClose === 'function') this._onClose();
      };

      this._handleOutsideClick = (event) => {
        if (event.target === this.element) this._closeModal();
      };

      this._handleKeydown = (event) => {
        if (!this.isActive) return;
        if (event.key === 'Escape' || event.key === 'Enter') {
          event.preventDefault();
          this._closeModal();
        }
      };

      this.btnElement.addEventListener('click', this._closeModal);
      this.element.addEventListener('click', this._handleOutsideClick);
      this.element.addEventListener('keydown', this._handleKeydown);
    }
  }

  // Класс для таймера
  class Timer extends UIComponent {
    constructor(element) {
      super(element);
      this.interval = null;
    }
    start(duration, onEnd, alertActiveChecker) {
      clearInterval(this.interval);
      this.setText(duration);
      this.resetStyle();
      this.interval = setInterval(() => {
        if (alertActiveChecker && alertActiveChecker()) return;
        let timeLeft = Number(this.element.textContent);
        if (timeLeft <= 0) {
          this.setText('0');
          clearInterval(this.interval);
          setTimeout(() => onEnd && onEnd(), 200);
          return;
        }
        timeLeft--;
        if (timeLeft === 10) {
          this.setColor('var(--red-color)');
          this.setBg('radial-gradient(var(--white-color) 30%, var(--silver-color), var(--red-color), var(--text-color))');
        }
        this.setText(timeLeft > 0 && timeLeft < 10 ? '0' + timeLeft : timeLeft);
      }, 1000);
    }
    stop() { clearInterval(this.interval); }
  }

  // Класс для подсказок
  class HintUtils {
    static generateHints(number) {
      return [
        `Загаданное число - ${number % 2 === 0 ? 'четное' : 'нечетное'} ${number.toString().length}-значное число.`,
        `Загаданное число больше ${Math.max(1, number - 17)}, но меньше ${Math.min(100, number + 9)}.`,
        `Если умножить загаданное число на 2, а затем вычесть 10, получится ${number * 2 - 10}.`
      ];
    }
  }

  // Класс для игры
  class Game {
    constructor() {
      // Получаем элементы
      this.mainPage = new UIComponent(document.getElementById('main'), 'flex');
      this.startBtn = new UIComponent(document.getElementById('start-btn'));
      this.modalGame = new UIComponent(document.getElementById('modal-game'), 'flex');
      this.timer = new Timer(document.getElementById('timer'));
      this.resultIndicator = new UIComponent(document.getElementById('result-indicator'));
      this.result = new UIComponent(document.getElementById('result'));
      this.secretCard = new UIComponent(document.getElementById('secret-card'));
      this.helpBtns = [
        new UIComponent(document.getElementById('help-btn-1')),
        new UIComponent(document.getElementById('help-btn-2')),
        new UIComponent(document.getElementById('help-btn-3'))
      ];
      this.guessInput = new UIComponent(document.getElementById('guess-input'));
      this.decreaseBtn = new UIComponent(document.getElementById('decrease-btn'));
      this.increaseBtn = new UIComponent(document.getElementById('increase-btn'));
      this.formBtn = new UIComponent(document.getElementById('form-btn'));
      this.gameBtns = new UIComponent(document.getElementById('game-btn'), 'flex');
      this.replayBtn = new UIComponent(document.getElementById('play-btn'));
      this.exitBtn = new UIComponent(document.getElementById('exit-btn'));
      this.alertModal = new AlertModal(
        document.getElementById('alert-modal'),
        document.getElementById('alert-message'),
        document.getElementById('alert-btn'),
        document.querySelector('.alert-modal__content')
      );
      this.state = {
        randomNumber: null,
        attempts: 5,
        maxAttempts: 5,
        isEnterPressed: false
      };
      this.handleGuessWrapper = null;
      this.blockInputKeydown = false;
      this.startBtn.addEventListener('click', () => this.startGame());
      this.decreaseBtn.addEventListener('click', () => this.changeInput(-1));
      this.increaseBtn.addEventListener('click', () => this.changeInput(1));
      this.replayBtn.addEventListener('click', () => this.resetAndStart());
      this.exitBtn.addEventListener('click', () => this.exitGame());
    }

    startGame() {
      if (this.alertModal.isActive) return;
      this.mainPage.hide();
      this.modalGame.show();
      this.state.randomNumber = Math.floor(Math.random() * 100) + 1;
      this.state.attempts = this.state.maxAttempts;
      this.result.setText(this.state.attempts);
      this.updateIndicator();
      this.timer.start(60, () => this.handleTimerEnd(), () => this.alertModal.isActive);
      if (this.handleGuessWrapper) {
        this.formBtn.removeEventListener('click', this.handleGuessWrapper);
      }
      this.handleGuessWrapper = (e) => this.handleGuess(e);
      this.formBtn.addEventListener('click', this.handleGuessWrapper);
      this.guessInput.focus();
      this.setupHintButtons();
      // Обработчик Enter
      this.guessInput.addEventListener('keydown', (event) => {
        if (this.blockInputKeydown) return;
        if (this.state.isEnterPressed) return;
        if (this.alertModal.isActive) return;
        if (event.key === 'Enter') {
          this.state.isEnterPressed = true;
          this.formBtn.element.dispatchEvent(new Event('click'));
          this.state.isEnterPressed = false;
        }
      });
    }

    handleGuess(e) {
      e.preventDefault();
      let userGuess;
      try {
        userGuess = Number(this.guessInput.element.value);
        if (!userGuess || userGuess < 1 || userGuess > 100) throw new RangeError('Введите число от 1 до 100!');
      } catch (err) {
        if (err instanceof RangeError) {
          this.alertModal.showAlert(err.message, 'info', () => {
            this.guessInput.focus();
          });
          this.decrementAttempts();
          this.guessInput.element.value = '';
          this.guessInput.blur();
          return;
        } else {
          this.alertModal.showAlert('Ошибка ввода!', 'info', () => {
            this.guessInput.focus();
          });
          this.guessInput.blur();
          return;
        }
      }

      if (userGuess === this.state.randomNumber) {
        this.endGame('Поздравляем! Вы угадали число!', 'win');
        this.decreaseBtn.hide();
        this.increaseBtn.hide();
        this.guessInput.addClass('success');
        return;
      } else {
        this.decrementAttempts();
      }

      if (this.state.attempts === 0) {
        this.endGame('Вы проиграли! Попробуйте еще раз!', 'lose');
        this.decreaseBtn.hide();
        this.increaseBtn.hide();
        this.guessInput.addClass('error');
        return;
      } else {
        this.alertModal.showAlert(
          userGuess > this.state.randomNumber ? 'Загаданное число меньше!' : 'Загаданное число больше!',
          'info',
          () => {
            this.blockInputKeydown = false;
            this.guessInput.focus();
          }
        );
        this.blockInputKeydown = true;
        this.timer.start(60, () => this.handleTimerEnd(), () => this.alertModal.isActive);
        this.guessInput.blur();
      }

      this.guessInput.element.value = '';
    }

    handleTimerEnd() {
      if (this.state.attempts > 1) {
        this.decrementAttempts();
        this.alertModal.showAlert(
          `Время вышло! Попробуйте еще раз! Чтобы угадать число, у вас осталось еще ${this.state.attempts} попытки(а).`,
          'info',
          () => {
            this.guessInput.element.value = '';
            this.guessInput.focus();
          }
        );
        this.timer.start(60, () => this.handleTimerEnd(), () => this.alertModal.isActive);
        this.guessInput.blur();
      } else {
        this.endGame('Вы проиграли! Попробуйте еще раз!', 'lose');
      }
    }

    decrementAttempts() {
      this.state.attempts--;
      this.result.setText(this.state.attempts);
      this.updateIndicator();
    }

    updateIndicator() {
      let percentage = (this.state.attempts / this.state.maxAttempts) * 100;
      if (this.state.attempts === 0) {
        this.resultIndicator.setBg('conic-gradient(var(--silver-color) 0% 100%)');
      } else {
        this.resultIndicator.setBg(`conic-gradient(var(--green-color) 0% ${percentage}%, var(--silver-color) ${percentage - 10}% ${percentage}%)`);
      }
    }

    endGame(message, type) {
      this.timer.stop();
      this.alertModal.showAlert(message, type, () => {
        this.guessInput.focus();
      });
      this.openSecretCard(type === 'lose');
      this.result.setText('0');
      this.updateIndicator();
      this.guessInput.blur();
      this.gameBtns.show();
    }

    openSecretCard(isLose = false) {
      const cardBack = this.secretCard.element.querySelector('.secret-number__card-back');
      // Сначала убираем все классы состояния
      cardBack.classList.remove('error');
      this.secretCard.removeClass('open');
      // Затем применяем нужные
      if (isLose) {
        cardBack.classList.add('error');
      }
      cardBack.textContent = this.state.randomNumber;
      this.secretCard.addClass('open');
    }

    setupHintButtons() {
      const hints = HintUtils.generateHints(this.state.randomNumber);
      this.helpBtns.forEach((btn, index) => {
        btn.element.replaceWith(btn.element.cloneNode(true)); // Сброс кнопки
        const newBtn = document.getElementById(btn.element.id);
        btn.element = newBtn; // Обновляем ссылку на кнопку

        const handler = (e) => {
          e.preventDefault();
          const back = btn.element.querySelector('.back');
          back.textContent = hints[index];
          btn.element.classList.add('flipped');
          this.guessInput.focus();
          btn.element.removeEventListener('click', handler);
        };

        btn.element.addEventListener('click', handler);
      });
    }

    changeInput(delta) {
      const currentValue = Number(this.guessInput.element.value) || 0;
      let newValue = currentValue + delta;
      if (newValue < 0) newValue = 0;
      if (newValue > 100) newValue = 100;
      this.guessInput.element.value = newValue;
    }

    resetAndStart() {
      this.resetSettings();
      this.startGame();
    }

    exitGame() {
      this.modalGame.hide();
      this.mainPage.show();
      this.resetSettings();
    }

    resetSettings() {
      this.timer.stop();
      this.state.attempts = this.state.maxAttempts;
      this.result.setText(this.state.attempts);
      this.resultIndicator.setBg('');
      this.secretCard.removeClass('error');
      this.secretCard.removeClass('open');
      this.guessInput.removeClass('success');
      this.guessInput.removeClass('error');
      this.guessInput.element.value = '';
      this.decreaseBtn.show();
      this.increaseBtn.show();
      this.gameBtns.hide();
      if (this.handleGuessWrapper) {
        this.formBtn.removeEventListener('click', this.handleGuessWrapper);
      }
      // Сброс подсказок
      this.helpBtns.forEach(btn => {
        btn.removeClass('flipped');
        const front = btn.element.querySelector('.front');
        if (front) front.textContent = front.dataset.default;
      });
      this.guessInput.focus();
    }
  }

  // Инициализация игры
  window.game = new Game();
})();