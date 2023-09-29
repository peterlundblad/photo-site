$(document).on('click', '.hamburger', function () {
    $('.menu').show();

    // $(".menu").animate({
    //   left: '250px',
    //   opacity: '0.5',
    // });

  });


  $(document).on('click', '.menu-esc', function () {
    $('.menu').hide();

  });