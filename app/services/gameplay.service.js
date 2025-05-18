export default class GameController {
    constructor() {
      this.gameStarted = false;
      this.gameOver = false;
      this.isCorrectAnswer = false;
      
      this.countdownTimer = null;
      this.hintBox = null;
      this.textInput = null;
      this.submitButton = null;
      
      this.handleGameStart = this.handleGameStart.bind(this);
      this.handleTimeout = this.handleTimeout.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
    
  
    init() {
      this.countdownTimer = document.querySelector('countdown-timer');
      this.hintBox = document.querySelector('hint-box');
      this.textInput = document.querySelector('text-input');
      this.submitButton = document.querySelector('#login-button');
      
      this.textInput.setAttribute('placeholder', 'Enter your answer');
      this.textInput.setAttribute('label', 'Your Answer');
      
      this.disableHints();
      this.disableSubmit();
      
      this.addEventListeners();
      
      console.log('Game controller initialized');
    }
    
    
    addEventListeners() {
      this.countdownTimer.addEventListener('click', (e) => {
        if (e.composedPath().some(el => el.classList && el.classList.contains('eye-button'))) {
          this.handleGameStart();
        }
      });
      
      this.countdownTimer.addEventListener('timeout', this.handleTimeout);
      
      this.submitButton.addEventListener('click', this.handleSubmit);
    }
    

    handleGameStart() {
      if (this.gameStarted || this.gameOver) return;
      
      setTimeout(() => {
        this.gameStarted = true;
        this.enableHints();
        this.enableSubmit();
        console.log('Game started');
      }, 500);
    }
    

    handleTimeout() {
      this.gameOver = true;
      this.disableHints();
      this.disableSubmit();
      this.disableTextInput();
      
      const gameOverMessage = document.createElement('div');
      gameOverMessage.style.textAlign = 'center';
      gameOverMessage.style.padding = '15px';
      gameOverMessage.style.color = '#FF4C4C';
      gameOverMessage.style.fontWeight = 'bold';
      gameOverMessage.textContent = 'Time\'s up!';
      
      const cardContent = document.querySelector('#appContent');
      cardContent.insertBefore(gameOverMessage, this.submitButton);
      
      console.log('Game over - time expired');
    }
    
    handleSubmit(event) {
      event.preventDefault();
      event.stopPropagation();
      
      if (!this.gameStarted || this.gameOver) return;
      
      const answer = this.textInput.inputValue.trim();
      
      if (!answer) {
        this.showError('Please enter an answer');
        return;
      }
      

      const correctAnswer = 'Leonardo da Vinci';
      this.isCorrectAnswer = answer.toLowerCase() === correctAnswer.toLowerCase();
      
      if (this.isCorrectAnswer) {
        this.handleCorrectAnswer();
      } else {
        this.showError('Incorrect answer! Try again.');
      }
    }
    

    handleCorrectAnswer() {
      this.gameOver = true;
      this.countdownTimer.stop();
      this.disableHints();
      this.disableSubmit();
      this.disableTextInput();
      
      const successMessage = document.createElement('div');
      successMessage.style.textAlign = 'center';
      successMessage.style.padding = '15px';
      successMessage.style.color = '#22C55E';
      successMessage.style.fontWeight = 'bold';
      successMessage.textContent = 'Correct! Well done!';
      
      const cardContent = document.querySelector('#appContent');
      cardContent.insertBefore(successMessage, this.submitButton);
      
      console.log('Game over - correct answer');
    }
    

    showError(message) {
      const existingError = document.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
      
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.style.textAlign = 'center';
      errorMessage.style.padding = '5px';
      errorMessage.style.color = '#FF4C4C';
      errorMessage.style.fontSize = '14px';
      errorMessage.textContent = message;
      
      const cardContent = document.querySelector('#appContent');
      cardContent.insertBefore(errorMessage, this.submitButton);
      
      setTimeout(() => {
        errorMessage.remove();
      }, 3000);
    }
    

    enableHints() {
      if (this.hintBox && typeof this.hintBox.enableHints === 'function') {
        this.hintBox.enableHints();
      } else {
        const hintButtons = this.hintBox.shadowRoot.querySelectorAll('.hint-reveal');
        hintButtons.forEach(btn => {
          btn.disabled = false;
          btn.style.cursor = 'pointer';
        });
        
        const hintIcons = this.hintBox.shadowRoot.querySelectorAll('.material-symbols-outlined');
        hintIcons.forEach(icon => {
          icon.style.opacity = '1';
          icon.style.cursor = 'pointer';
        });
      }
    }
    

    disableHints() {
      if (this.hintBox && typeof this.hintBox.disableHints === 'function') {
        this.hintBox.disableHints();
      } else {
        const hintButtons = this.hintBox.shadowRoot.querySelectorAll('.hint-reveal');
        hintButtons.forEach(btn => {
          btn.disabled = true;
          btn.style.cursor = 'default';
        });
        
        const hintIcons = this.hintBox.shadowRoot.querySelectorAll('.material-symbols-outlined');
        hintIcons.forEach(icon => {
          icon.style.opacity = '0.5';
          icon.style.cursor = 'default';
        });
      }
    }
    

    enableSubmit() {
      const buttonElement = this.submitButton.shadowRoot.querySelector('button');
      buttonElement.disabled = false;
      buttonElement.style.opacity = '1';
      buttonElement.style.cursor = 'pointer';
    }
    

    disableSubmit() {
      const buttonElement = this.submitButton.shadowRoot.querySelector('button');
      buttonElement.disabled = true;
      buttonElement.style.opacity = '0.6';
      buttonElement.style.cursor = 'default';
    }
    
 
    disableTextInput() {
      const input = this.textInput.shadowRoot.querySelector('input');
      input.disabled = true;
      input.style.opacity = '0.6';
      input.style.cursor = 'default';
    }
  }