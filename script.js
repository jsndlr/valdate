// document.addEventListener('DOMContentLoaded', function() {
//     const noButton = document.getElementById('no');
  
//     function getRandomPosition() {
//         const x = Math.floor(Math.random() * (window.innerWidth - noButton.offsetWidth));
//         const y = Math.floor(Math.random() * (window.innerHeight - noButton.offsetHeight));
//         return { x, y };
//     }

//     function updateButtonPosition() {
//         const position = getRandomPosition();
//         noButton.style.transition = 'top .7s, left .7s';
//         noButton.style.left = position.x + 'px';
//         noButton.style.top = position.y + 'px';
//     }

//     noButton.addEventListener('mouseover', updateButtonPosition);
//     window.addEventListener('resize', updateButtonPosition);
// });
