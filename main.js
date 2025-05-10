(() => {
  'use strict';

  // Получаем элементы из HTML
  const mainPage = document.getElementById('main'),
    startBtn = document.getElementById('start-btn'),
    modalGame = document.getElementById('modal-game'),
    timer = document.getElementById('timer'),
    resultIndicator = document.getElementById('result-indicator'),
    result = document.getElementById('result'),
    secretCard = document.getElementById('secret-card'),
    helpBtnOne = document.getElementById('help-btn-1'),
    helpBtnTwo = document.getElementById('help-btn-2'),
    helpBtnThree = document.getElementById('help-btn-3'),
    guessInput = document.getElementById('guess-input'),
    decreaseBtn = document.getElementById('decrease-btn'),
    increaseBtn = document.getElementById('increase-btn'),
    formBtn = document.getElementById('form-btn'),
    gameBtns = document.getElementById('game-btn'),
    replayBtn = document.getElementById('play-btn'),
    exitBtn = document.getElementById('exit-btn'),
    alertModal = document.getElementById('alert-modal'),
    alertModalContent = document.querySelector('.alert-modal__content'),
    alertMessage = document.getElementById('alert-message'),
    alertBtn = document.getElementById('alert-btn');

  let timerInterval; // Переменная для хранения интервала таймера
  let handleGuessWrapper; // Объявляем переменную на уровне модуля

  const gameState = {
    isAlertActive: false, // Флаг для отслеживания активности алерта
    currentAlertType: null, // Переменная для хранения типа текущего алерта
    isEnterPressed: false, // Флаг для отслеживания нажатия Enter    
  };

  // Открытие модального окна
  startBtn.addEventListener('click', startGame);

  // Начало игры
  function startGame() {
    if (alertModal.style.display === 'flex') {
      return; // Если модальное окно активно, ничего не делаем
    }

    mainPage.style.display = 'none';
    modalGame.style.display = 'flex';

    const randomNumber = Math.floor(Math.random() * 100) + 1;

    // Установка начального количества попыток
    result.textContent = '5';
    updateIndicator(5, 5);

    // Запуск таймера
    startTimer(60, handleTimerEnd);

    // Удаляем предыдущий обработчик, если он был добавлен
    if (handleGuessWrapper) {
      formBtn.removeEventListener('click', handleGuessWrapper);
    }

    // Создаем новый обработчик с замыканием
    handleGuessWrapper = createHandleGuessWrapper(randomNumber);

    // Добавляем новый обработчик
    formBtn.addEventListener('click', handleGuessWrapper);

    // Устанавливаем курсор в инпут
    guessInput.focus();

    // Настраиваем подсказки
    setupHintButtons(randomNumber);

    // Добавляем обработчик для клавиши Enter
    guessInput.addEventListener('keydown', (event) => {
      if (gameState.isEnterPressed) return; // Игнорируем, если Enter уже был нажат

      if (gameState.isAlertActive) {
        return; // Игнорируем ввод, если активен алерт
      }

      if (event.key === 'Enter') {
        gameState.isEnterPressed = true;
        formBtn.dispatchEvent(new Event('click')); // Симулируем клик по кнопке "Угадать"
        setTimeout(() => {
          gameState.isEnterPressed = false;
        }, 200);
      }
    });

    // Добавляем проверку для click и keydown
    guessInput.addEventListener('click', (event) => {
      event.preventDefault(); // Предотвращаем конфликт с keydown
      guessInput.focus(); // Устанавливаем фокус на инпут при клике
    });

    // В обработчике keydown для guessInput
    guessInput.addEventListener('keydown', (event) => {
      console.log('keydown event:', event.key, 'isEnterPressed:', gameState.isEnterPressed, 'isAlertActive:', gameState.isAlertActive);

      if (gameState.isEnterPressed) {
        return;
      }

      if (gameState.isAlertActive) {
        return;
      }

      if (event.key === 'Enter') {
        gameState.isEnterPressed = true;
        formBtn.dispatchEvent(new Event('click'));
        setTimeout(() => {
          gameState.isEnterPressed = false;
        }, 200);
      }
    });

    // Добавляем обработчики для мобильных устройств при старте игры
    if (window.matchMedia('(pointer: coarse)').matches) {
      addMobileEventListeners();
    }
  }

  function showAlert(message, type = 'info') {
    if (gameState.isAlertActive) {
      return;
    }

    gameState.currentAlertType = type;

    // Останавливаем таймер при любом алерте
    clearInterval(timerInterval);

    setTimeout(() => {
      alertMessage.textContent = message;

      // Добавляем класс в зависимости от типа
      if (type === 'win') {
        alertModalContent.classList.add('alert-win');
      } else if (type === 'lose') {
        alertModalContent.classList.add('alert-lose');
      } else {
        alertModalContent.classList.add('alert-info');
      }

      alertModal.style.display = 'flex';
      alertBtn.focus();
      gameState.isAlertActive = true;
    }, 100);

    const closeModal = () => {
      alertModal.style.display = 'none';
      alertModalContent.classList.remove('alert-win', 'alert-lose', 'alert-info');
      alertBtn.blur();
      gameState.isAlertActive = false;
      alertBtn.removeEventListener('click', closeModal);
      alertModal.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeydown);

      // Возвращаем фокус на инпут только для информативных алертов
      if (gameState.currentAlertType === 'info') return guessInput.focus();
      // Очищаем инпут, если алерт "Время вышло"
      if (message.includes('Время вышло')) {
        guessInput.value = '';
      }
    };

    const handleOutsideClick = (event) => {
      if (event.target === alertModal) {
        closeModal();
      }
    };

    const handleKeydown = (event) => {
      if (gameState.isEnterPressed) return;

      if (event.key === 'Escape' || event.key === 'Enter') {
        if (gameState.isAlertActive) {
          gameState.isEnterPressed = true;
          closeModal();
          setTimeout(() => {
            gameState.isEnterPressed = false;
          }, 200); // Небольшая задержка для предотвращения повторного срабатывания
        }
      }
    };

    // Возвращаем фокус на инпут после закрытия алерта
    if (!gameState.isAlertActive) {
      guessInput.focus();
    }

    alertBtn.addEventListener('click', closeModal);
    alertModal.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeydown);
  };

  // Функция для запуска таймера
  function startTimer(duration, onEnd) {
    clearInterval(timerInterval); // Очищаем предыдущий таймер
    timer.textContent = duration;

    // Сбрасываем стили перед началом нового отсчета
    timer.style.color = '';
    timer.style.backgroundImage = '';

    timerInterval = setInterval(() => {
      if (gameState.isAlertActive) {
        return; // Прерываем выполнение, если активен алерт
      }

      let timeLeft = Number(timer.textContent);

      if (timeLeft <= 0) {
        timer.textContent = '0'; // Устанавливаем 0 при завершении
        clearInterval(timerInterval);
        if (!gameState.isAlertActive) {
          setTimeout(() => onEnd(), 200); // Добавляем задержку перед вызовом onEnd
        }
        return; // Прерываем выполнение, чтобы не продолжать уменьшение
      }

      timeLeft--;

      if (timeLeft === 10) {
        timer.style.color = `var(--red-color)`;
        timer.style.backgroundImage = `radial-gradient(var(--white-color) 30%, var(--silver-color), var(--red-color), var(--text-color))`;
      }

      // Обновляем значение таймера с ведущим нулем только для значений от 1 до 9
      timer.textContent = timeLeft > 0 && timeLeft < 10 ? '0' + timeLeft : timeLeft;
    }, 1000);
  }

  // Функция обработки завершения таймера
  function handleTimerEnd() {
    if (result.textContent !== '0') {
      result.textContent = Number(result.textContent) - 1;
      updateIndicator(Number(result.textContent), 5); // Обновляем индикатор

      showAlert(`Время вышло! Попробуйте еще раз! Чтобы угадать число, у вас осталось еще ${result.textContent} попытки(а).`, 'info');

      startTimer(60, handleTimerEnd); // Перезапускаем таймер
    } else {
      showAlert('Вы проиграли! Попробуйте еще раз!', 'lose');
    }
  }

  // Функция обновления индикатора
  function updateIndicator(current, max) {
    const percentage = (current / max) * 100; // Вычисляем процент оставшихся попыток

    resultIndicator.style.backgroundImage = `
        conic-gradient(
          var(--green-color) 0% ${percentage}%, 
          var(--silver-color) ${percentage - 10}% ${percentage}%)`;
  }

  // Функция для открытия карточки с загаданным числом
  function openSecretCard(number) {
    const cardBack = secretCard.querySelector('.secret-number__card-back');

    if (result.textContent === '0') {
      cardBack.classList.add('error');
    }

    cardBack.textContent = number;
    secretCard.classList.add('open');
  }

  // Функция для генерации подсказок
  function generateHints(number) {
    return [
      `Загаданное число - ${number % 2 === 0 ? 'четное' : 'нечетное'} ${number.toString().length}-значное число.`,
      `Загаданное число больше ${Math.max(1, number - 17)}, но меньше ${Math.min(100, number + 9)}.`,
      `Если умножить загаданное число на 2, а затем вычесть 10, получится ${number * 2 - 10}.`
    ];
  }

  // Функция для преобразования кнопки в карточку подсказки с анимацией
  function transformButtonToHint(button, hint) {
    const back = button.querySelector('.back');
    back.textContent = hint;
    button.classList.add('flipped');

    if (startGame) {
      button.classList.remove('.back');
      button.classList.add('.front');
    }

    // Убираем возможность повторного клика
    button.removeEventListener('click', handleHintClick);
  }

  // Обработчик клика для подсказок
  function handleHintClick(event, randomNumber) {
    event.preventDefault();
    const button = event.currentTarget;
    const hintIndex = parseInt(button.id.split('-')[2], 10) - 1; // Получаем индекс подсказки
    const hints = generateHints(randomNumber); // Генерируем подсказки
    transformButtonToHint(button, hints[hintIndex]);
    guessInput.focus();
  }

  // Обработчики для кнопок подсказок
  function setupHintButtons(randomNumber) {
    helpBtnOne.addEventListener('click', (event) => handleHintClick(event, randomNumber));
    helpBtnTwo.addEventListener('click', (event) => handleHintClick(event, randomNumber));
    helpBtnThree.addEventListener('click', (event) => handleHintClick(event, randomNumber));
  }

  // Функция для обработки ввода числа
  function handleGuess(e, randomNumber) {
    e.preventDefault();

    if (alertMessage.style.display === 'flex') {
      return; // Если модальное окно открыто, игнорируем ввод
    }

    const userGuess = Number(guessInput.value);

    // Проверяем, введено ли корректное число
    if (!userGuess || userGuess < 1 || userGuess > 100) {
      showAlert('Введите число от 1 до 100!', 'info');
      result.textContent = Number(result.textContent) - 1;
      updateIndicator(Number(result.textContent), 5);
      guessInput.value = '';
      return; // Прерываем выполнение, чтобы не продолжать обработку
    }

    if (userGuess === randomNumber) {
      endGame('Поздравляем! Вы угадали число!', randomNumber, 'win');
      decreaseBtn.style.display = 'none';
      increaseBtn.style.display = 'none';
      guessInput.classList.add('success');
      return;
    } else {
      result.textContent = Number(result.textContent) - 1;
      updateIndicator(Number(result.textContent), 5);
    }

    if (result.textContent === '0') {
      endGame('Вы проиграли! Попробуйте еще раз!', randomNumber, 'lose');
      decreaseBtn.style.display = 'none';
      increaseBtn.style.display = 'none';
      guessInput.classList.add('error');
      return;
    } else {
      showAlert(userGuess > randomNumber ? 'Загаданное число меньше!' : 'Загаданное число больше!', 'info');
      startTimer(60, handleTimerEnd);
      guessInput.focus();
    }

    guessInput.value = '';
  }

  // Оборачиваем обработчик в функцию, чтобы передать randomNumber
  function createHandleGuessWrapper(randomNumber) {
    return function handleGuessWrapper(e) {
      handleGuess(e, randomNumber);
    };
  }

  // Обработчики для кнопок "+" и "-"
  decreaseBtn.addEventListener('click', () => {
    const currentValue = Number(guessInput.value) || 0;
    if (currentValue > 0) {
      guessInput.value = currentValue - 1;
    }
  });

  increaseBtn.addEventListener('click', () => {
    const currentValue = Number(guessInput.value) || 0;
    if (currentValue < 100) {
      guessInput.value = currentValue + 1;
    }
  });

  // Функция завершения игры
  function endGame(message, number, type) {
    clearInterval(timerInterval); // Останавливаем таймера
    showAlert(message, type); // Показываем сообщение
    openSecretCard(number); // Открываем карточку с загаданным числом
    startTimer(0, () => { }); // Останавливаем таймер
    result.textContent = '0'; // Устанавливаем количество попыток в 0
    updateIndicator(0, 5); // Обновляем индикатор до 0%
    guessInput.blur();
    gameBtns.style.display = 'flex';

    replayBtn.addEventListener('click', () => {
      resetSettings(); // Сбрасываем настройки перед началом новой игры
      startGame();
    });
    exitBtn.addEventListener('click', exitGame);
  }

  // Выход на главную страницу
  function exitGame() {
    modalGame.style.display = 'none';
    mainPage.style.display = 'block';
    resetSettings();
  }

  // Функция для сброса настроек
  function resetSettings() {
    clearInterval(timerInterval);
    result.textContent = '5'; // Сбрасываем количество попыток
    resultIndicator.style.backgroundImage = '';
    secretCard.classList.remove('error', 'open');

    guessInput.classList.remove('success', 'error');
    guessInput.value = '';
    decreaseBtn.style.display = 'block';
    increaseBtn.style.display = 'block';

    gameBtns.style.display = 'none';

    // Сбрасываем флаг активности алерта
    gameState.isAlertActive = false;
    gameState.currentAlertType = null;

    // Удаляем обработчики событий, чтобы избежать дублирования
    formBtn.removeEventListener('click', handleGuessWrapper);
    replayBtn.removeEventListener('click', startGame);
    exitBtn.removeEventListener('click', exitGame);

    // Сбрасываем карточки подсказок
    const helpButtons = document.querySelectorAll('.help__btn');
    helpButtons.forEach(button => {
      button.classList.remove('flipped');
      const front = button.querySelector('.front');
      front.textContent = front.dataset.default; // Восстанавливаем текст из data-default html
    });

    // Добавляем обработчики для мобильных устройств при сбросе настроек
    if (window.matchMedia('(pointer: coarse)').matches) {
      addMobileEventListeners();
    }
  }

  // Добавление обработчиков событий для мобильных устройств
  function addMobileEventListeners() {
    // Обработчик для кнопки "Угадать"
    formBtn.addEventListener('pointerdown', () => {
      formBtn.dispatchEvent(new Event('click'));
    });

    // Обработчик для кнопок "+" и "-"
    decreaseBtn.addEventListener('pointerdown', () => {
      const currentValue = Number(guessInput.value) || 0;
      if (currentValue > 0) {
        guessInput.value = currentValue - 1;
      }
    });

    increaseBtn.addEventListener('pointerdown', () => {
      const currentValue = Number(guessInput.value) || 0;
      if (currentValue < 100) {
        guessInput.value = currentValue + 1;
      }
    });

    // Обработчик для инпута
    guessInput.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      guessInput.focus();
    });
  }

  // Определяем устройство и добавляем соответствующие обработчики
  if (window.matchMedia('(pointer: coarse)').matches) {
    addMobileEventListeners();
  }

})();