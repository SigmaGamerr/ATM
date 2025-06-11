"use strict";

var is_fullscreen = false;

function open_fullscreen() {
    let game = document.getElementById("gameCanvas");
    if (is_fullscreen) {
        // Exit fullscreen
        is_fullscreen = false;
        if (is_mobile_device()) {
            game.style.position = "absolute";
            let backBtn = document.getElementById("mobile-back-button");
            if (backBtn) backBtn.style.display = "none";
            let gamePlayer = document.getElementById("game-player");
            if (gamePlayer) gamePlayer.style.display = "none";
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { /* Firefox */
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE/Edge */
                document.msExitFullscreen();
            }
        }
    } else {
        // Enter fullscreen
        is_fullscreen = true;
        if (is_mobile_device()) {
            let gamePlayer = document.getElementById("game-player");
            if (gamePlayer) gamePlayer.style.display = "block";
            game.style.position = "fixed";
            let backBtn = document.getElementById("mobile-back-button");
            if (backBtn) backBtn.style.display = "flex";
        } else {
            if (game.requestFullscreen) {
                game.requestFullscreen();
            } else if (game.mozRequestFullScreen) { /* Firefox */
                game.mozRequestFullScreen();
            } else if (game.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                game.webkitRequestFullscreen();
            } else if (game.msRequestFullscreen) { /* IE/Edge */
                game.msRequestFullscreen();
            }
        }
    }
}

function is_mobile_device() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
}

if(document.querySelector('iframe#gameCanvas')){
    load_leaderboard({type: 'top', amount: 10});
    drag_back_btn(document.getElementById("mobile-back-button"));
    if(is_mobile_device()){
        if(document.getElementById('allow_mobile_version')){
            document.getElementById('mobile-play').style.display = 'block';
            document.getElementById('game-player').style.display = 'none';
        }
    }
}

function drag_back_btn(elem) {
    if (!elem) return;
    let is_drag = false;
    let pos_1 = 0, pos_2 = 0;
    let last_y = elem.style.top;
    let touchstart_y = 0;
    elem.addEventListener("touchend", function(e) {
        if(is_drag){
            is_drag = false;
        }
    }, false);
    elem.addEventListener("touchmove", function(e) {
        e.preventDefault();
        let touch = e.changedTouches[0];
        if(!is_drag){
            if(touchstart_y < touch.clientY+5 || touchstart_y > touch.clientY-5){
                // Trigger "dragstart"
                pos_2 = e.clientY;
                is_drag = true;
            }
        }
        if(is_drag){
            pos_1 = pos_2 - touch.clientY;
            pos_2 = touch.clientY;
            elem.style.top = (pos_2) + "px";
        }
    }, false);
    elem.addEventListener("touchstart", function(e) {
        let touch = e.changedTouches[0];
        last_y = elem.style.top;
        touchstart_y = touch.clientY;
    }, false);
    elem.addEventListener("click", function(e) {
        e.preventDefault();
        if(last_y == elem.style.top){
            open_fullscreen();
        }
    }, false);
}

function load_leaderboard(conf){
    if(document.getElementById('content-leaderboard')){
        let g_id = document.getElementById('content-leaderboard').dataset.id;
        $.ajax({
            url: '/includes/api.php',
            type: 'POST',
            dataType: 'json',
            data: {'action': 'get_scoreboard', 'game-id': g_id, 'conf': JSON.stringify(conf)},
            complete: function (data) {
                if(data.responseText){
                    if(JSON.parse(data.responseText).length){
                        show_leaderboard(JSON.parse(data.responseText));
                    }
                }
            }
        });
    }
}

function show_leaderboard(data){
    let html = '<table class="table table-striped table-dark"><thead class="thead-dark"><tr><th scope="col">#</th><th scope="col">Username</th><th scope="col">Score</th><th scope="col">Date</th></tr></thead><tbody>';
    let index = 1;
    data.forEach((item)=>{
        html += '<tr><th scope="row">'+index+'</th><td>'+item.username+'</td><td>'+item.score+'</td><td>'+item.created_date.substr(0, 10)+'</td></tr>';
        index++;
    });
    html += '</tbody></table>';
    document.getElementById('content-leaderboard').innerHTML = html;
}

(function(){
    let last_offset = document.getElementById("new-games-section") ? document.getElementById("new-games-section").children.length : 0;
    let load_amount = 12;

    let loadMoreBtn = document.getElementById('load-more1');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadMoreBtn.classList.add('disabled');
            fetch_games(load_amount, 'new');
        });
    }

    function fetch_games(amount, sort_by) {
        $.ajax({
            url: "/includes/fetch.php",
            type: 'POST',
            dataType: 'json',
            data: {amount: amount, offset: last_offset, sort_by: sort_by},
            complete: function (data) {
                append_content(JSON.parse(data.responseText));
            }
        });
    }

    function append_content(data){
        last_offset += data.length;
        data.forEach((game)=>{
            let rating = 0;
            game['upvote'] = Number(game['upvote']);
            game['downvote'] = Number(game['downvote']);
            let total_revs = game['upvote']+game['downvote'];
            if(total_revs > 0){
                rating = (Math.round((game['upvote']/(game['upvote']+game['downvote'])) * 5) / 10);
            }
            let html = '<div class="col-md-2 col-sm-3 col-4 grid-1">';
            html += '<a href="/game/'+game['slug']+'/">';
            html += '<div class="game-item">'
            html += '<div class="list-game">';
            html += '<div class="list-thumbnail"><img src="'+game['thumb_2']+'" class="small-thumb img-rounded" alt="'+game['title']+'"></div>';
            html += '<div class="list-info">';
            html += '<div class="list-title">'+game['title']+'</div>';
            html += '</div></div></div></a></div>';
            if(document.getElementById("new-games-section")){
                document.getElementById("new-games-section").insertAdjacentHTML('beforeend', html);
            }
        });
        if(data.length < load_amount){
            if(loadMoreBtn){
                loadMoreBtn.textContent = "No More Games";
                loadMoreBtn.classList.add("noContent", "disabled");
            }
        } else {
            if(loadMoreBtn){
                loadMoreBtn.classList.remove('disabled');
            }
        }
    }

    let mobilePlayBtn = document.getElementById('mobile-play-btn');
    if(mobilePlayBtn){
        mobilePlayBtn.addEventListener('click', function(e) {
            open_fullscreen();
        });
    }

    // Voting buttons
    ['favorite', 'upvote', 'downvote'].forEach(action => {
        let btn = document.getElementById(action);
        if(btn){
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                let data_id = document.querySelector('.game-content').getAttribute('data-id');
                $.ajax({
                    url: '/includes/vote.php',
                    type: 'POST',
                    dataType: 'json',
                    data: {[action]: true, 'action': action, 'id': data_id},
                    complete: function (data) {
                        console.log(data.responseText);
                        btn.classList.add('active', 'disabled');
                    }
                });
            });
        }
    });

    // User avatar toggle
    let userAvatars = document.querySelectorAll('.user-avatar');
    userAvatars.forEach((avatar) => {
        avatar.addEventListener('click', function(){
            let element = avatar.nextElementSibling;
            if(element){
                if (element.classList.contains("hidden")) {
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            }
        });
    });

    // Scroll buttons
    [
        ['btn_prev', '.profile-gamelist ul', '-=150'],
        ['btn_next', '.profile-gamelist ul', '+=150'],
        ['f_prev', '.favorite-gamelist ul', '-=150'],
        ['f_next', '.favorite-gamelist ul', '+=150'],
        ['t-prev', '.list-1-wrapper', '-=150'],
        ['t-next', '.list-1-wrapper', '+=150']
    ].forEach(([btnId, selector, scrollAmount]) => {
        let btn = document.getElementById(btnId);
        if(btn){
            btn.addEventListener('click', () => {
                const el = document.querySelector(selector);
                if(el){
                    $(el).animate({ scrollLeft: scrollAmount }, 300, 'swing');
                }
            });
        }
    });

    // Delete comment button
    document.querySelectorAll('.delete-comment').forEach((delBtn) => {
        delBtn.addEventListener('click', function() {
            let id = this.getAttribute('data-id');
            $.ajax({
                url: '/includes/comment.php',
                type: 'POST',
                dataType: 'json',
                data: {'delete': true, 'id': id},
                complete: function (data) {
                    if(data.responseText === 'deleted'){
                        document.querySelector('.id-'+id).remove();
                    }
                }
            });
        });
    });

    let game_id;
    if(document.getElementById('comments')){
        game_id = document.querySelector('.game-content').getAttribute('data-id');
        $.ajax({
            url: '/includes/comment.php',
            type: 'POST',
            dataType: 'json',
            data: {'load': true, 'game_id': game_id},
            complete: function (data) {
                let comments = JSON.parse(data.responseText);
                load_comments(convert_comments(comments));
            }
        });
    }

    function convert_comments(array){
        let data = [];
        array.forEach((item)=>{
            let arr = {
                id: Number(item.id),
                created: item.created_date,
                content: item.comment,
                fullname: item.sender_username,
                profile_picture_url: item.avatar,
            };
            if(Number(item.parent_id)){
                arr.parent = Number(item.parent_id);
            }
            if(!arr.fullname){
                arr.fullname = 'Anonymous';
            }
            data.push(arr);
        });
        return data;
    }

    function load_comments(array){
        let read_only = false;
        let avatar = document.querySelector('.user-avatar img')?.src;
        if(!avatar){
            avatar = '/images/default_profile.png';
            read_only = true;
        }
        $('#comments').comments({
            enableUpvoting:false,
            roundProfilePictures: true,
            popularText: '',
            profilePictureURL: avatar,
            readOnly: read_only,
            getComments: function(success, error) {
                success(array);
            },
            postComment: function(commentJSON, success, error) {
                commentJSON.source = 'jquery-comments';
                commentJSON.send = true;
                commentJSON.game_id = game_id;
                $.ajax({
                    type: 'post',
                    url: '/includes/comment.php',
                    data: commentJSON,
                    success: function(comment) {
                        console.log(comment);
                        success(commentJSON)
                    },
                    error: error
                });
            }
        });
    }
})();
