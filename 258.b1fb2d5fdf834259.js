"use strict";(self.webpackChunkportfolio=self.webpackChunkportfolio||[]).push([[258],{3258:(O,g,a)=>{a.r(g),a.d(g,{HomeComponent:()=>A});var t=a(4650);let y=(()=>{class n{}return n.\u0275fac=function(e){return new(e||n)},n.\u0275cmp=t.Xpm({type:n,selectors:[["app-biography"]],standalone:!0,features:[t.jDz],decls:23,vars:0,consts:[["id","about",1,"section"],["src","assets/images/home/biography.jpg","width","100%","alt","Dale Nguyen"]],template:function(e,i){1&e&&(t.TgZ(0,"section",0)(1,"div")(2,"header")(3,"h2"),t._uU(4,"Biography"),t.qZA()(),t.TgZ(5,"div")(6,"div"),t._UZ(7,"img",1),t.qZA(),t.TgZ(8,"div")(9,"p"),t._uU(10,"I have done researching and creating my first IT blog since 2012 then starting to design websites and web applications, and I am passionate about the web development career."),t.qZA(),t.TgZ(11,"p"),t._uU(12,"I am a full stack developer. I take projects from the initial concept stage through to completion. I stay on top of leading front and back end technologies such as "),t.TgZ(13,"strong"),t._uU(14,"Angular, NodeJS, Firebase, SQL/NoSQL, LAMP Stack (Linux, Apache, MySQL and PHP), HTML 5 and CSS 3, Docker, Resful API"),t.qZA(),t._uU(15," to ensure the optimum code peformance and site security for my clients."),t.qZA(),t.TgZ(16,"p"),t._uU(17,"My favourite work environments are "),t.TgZ(18,"strong"),t._uU(19,"Angular, NodeJS and Firebase"),t.qZA(),t._uU(20,". They are outstanding digital technologies because of pre-build flexibility, ease-of-use structure code that allows you to spend more time on creating an actual website instead of spending time on repetitive code."),t.qZA(),t.TgZ(21,"p"),t._uU(22,"In my spare time, I love to travel as much as possible."),t.qZA()()()()())},styles:["#about[_ngcontent-%COMP%]{min-height:500px}#about[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{text-align:center}#about[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{max-width:500px;float:left;padding-right:20px;padding-bottom:20px}"],changeDetection:0}),n})();var p=a(9040);let v=(()=>{class n{}return n.\u0275fac=function(e){return new(e||n)},n.\u0275cmp=t.Xpm({type:n,selectors:[["app-contact"]],standalone:!0,features:[t.jDz],decls:12,vars:0,consts:[["id","contact",1,"section"],[1,"container"],["fontSet","fa","fontIcon","fa-envelope"],["href","mailto:dale@dalenguyen.me"]],template:function(e,i){1&e&&(t.TgZ(0,"section",0)(1,"div",1)(2,"header")(3,"h2"),t._uU(4,"Let's work together"),t.qZA()(),t.TgZ(5,"p"),t._uU(6,"If you have something interesting, shoot me an email."),t.qZA(),t.TgZ(7,"h4"),t._UZ(8,"mat-icon",2),t.TgZ(9,"a",3),t._uU(10," dale@dalenguyen.me"),t.qZA()(),t._UZ(11,"br"),t.qZA()())},dependencies:[p.Ps,p.Hw],styles:["#contact[_ngcontent-%COMP%]{text-align:center;background-color:#e8edec}#contact[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%]{display:flex;justify-content:center}#contact[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{color:#888}"],changeDetection:0}),n})();var m=a(6223);let C=(()=>{class n{constructor(e){this.navService=e}}return n.\u0275fac=function(e){return new(e||n)(t.Y36(m.t))},n.\u0275cmp=t.Xpm({type:n,selectors:[["app-intro"]],standalone:!0,features:[t._Bn([m.t]),t.jDz],decls:9,vars:0,consts:[["id","intro",1,"section"],[1,"container"],[1,"alt"],["mat-raised-button","","color","primary",3,"click"],["fontSet","fa","fontIcon","fa-arrow-circle-down"]],template:function(e,i){1&e&&(t.TgZ(0,"section",0)(1,"div",1)(2,"header")(3,"h2",2),t._uU(4,"My name is Dale Nguyen. I am a Toronto based digital architect. My competent professional work environments are Angular, Firebase, NodeJS, Javasript/TypeScript, SQL/NoSQL, HTML 5 and CSS, Linux, Docker..."),t.qZA()(),t.TgZ(5,"div")(6,"button",3),t.NdJ("click",function(){return i.navService.target.next("contact")}),t._UZ(7,"mat-icon",4),t._uU(8,"Let's meet "),t.qZA()()()())},dependencies:[p.Ps,p.Hw],styles:["#intro[_ngcontent-%COMP%]{background-image:url(/assets/images/home/intro.jpg);background-size:cover;background-position:center center;text-align:center;color:#ffffff80}#intro[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]{display:flex;margin:0 auto;align-items:center}#intro[_ngcontent-%COMP%]   mat-icon[_ngcontent-%COMP%]{display:flex;align-items:center}"],changeDetection:0}),n})();var l=a(6895),d=a(529),Z=a(9551),P=a(4004),_=a(7579),T=a(6063);class b extends _.x{constructor(o=1/0,e=1/0,i=T.l){super(),this._bufferSize=o,this._windowTime=e,this._timestampProvider=i,this._buffer=[],this._infiniteTimeWindow=!0,this._infiniteTimeWindow=e===1/0,this._bufferSize=Math.max(1,o),this._windowTime=Math.max(1,e)}next(o){const{isStopped:e,_buffer:i,_infiniteTimeWindow:r,_timestampProvider:s,_windowTime:c}=this;e||(i.push(o),!r&&i.push(s.now()+c)),this._trimBuffer(),super.next(o)}_subscribe(o){this._throwIfClosed(),this._trimBuffer();const e=this._innerSubscribe(o),{_infiniteTimeWindow:i,_buffer:r}=this,s=r.slice();for(let c=0;c<s.length&&!o.closed;c+=i?1:2)o.next(s[c]);return this._checkFinalizedStatuses(o),e}_trimBuffer(){const{_bufferSize:o,_timestampProvider:e,_buffer:i,_infiniteTimeWindow:r}=this,s=(r?1:2)*o;if(o<1/0&&s<i.length&&i.splice(0,i.length-s),!r){const c=e.now();let u=0;for(let f=1;f<i.length&&i[f]<=c;f+=2)u=f;u&&i.splice(0,u+1)}}}var x=a(3099),I=a(262);let h=(()=>{class n{constructor(e){this.http=e,this.projects$=null,this.gitProjects=["rest-api-node-typescript","firestore-backup-restore","firebase-wordpress-plugin","serverless-rest-api","firebase-functions-helper","stockai"],this.gitBaseUrl="https://api.github.com/users/dalenguyen/repos?per_page=100",this.getGitProjects()}getGitProjects(){this.projects$=this.http.get(this.gitBaseUrl).pipe((0,P.U)(e=>e.filter(i=>this.gitProjects.includes(i.name))),function j(n,o,e){let i,r=!1;return n&&"object"==typeof n?({bufferSize:i=1/0,windowTime:o=1/0,refCount:r=!1,scheduler:e}=n):i=n??1/0,(0,x.B)({connector:()=>new b(i,o,e),resetOnError:!0,resetOnComplete:!1,resetOnRefCountZero:r})}({bufferSize:1,refCount:!0}),(0,I.K)(e=>(0,Z.Tb)(e)))}}return n.\u0275fac=function(e){return new(e||n)(t.LFG(d.eN))},n.\u0275prov=t.Yz7({token:n,factory:n.\u0275fac}),n})();function M(n,o){if(1&n&&(t.TgZ(0,"div",4)(1,"a",5),t._uU(2),t.qZA(),t.TgZ(3,"p"),t._uU(4),t.qZA(),t.TgZ(5,"div")(6,"span"),t._UZ(7,"mat-icon",6),t._uU(8),t.qZA(),t.TgZ(9,"span"),t._UZ(10,"mat-icon",7),t._uU(11),t.qZA(),t.TgZ(12,"span"),t._UZ(13,"mat-icon",8),t._uU(14),t.qZA()()()),2&n){const e=o.$implicit;t.xp6(1),t.s9C("href",e.html_url,t.LSH),t.xp6(1),t.Oqu(e.name),t.xp6(2),t.Oqu(e.description),t.xp6(4),t.hij(" ",e.language,""),t.xp6(3),t.hij(" ",e.stargazers_count,""),t.xp6(3),t.hij(" ",e.forks,"")}}function S(n,o){if(1&n&&(t.TgZ(0,"div",2),t.YNc(1,M,15,6,"div",3),t.qZA()),2&n){const e=o.ngIf;t.xp6(1),t.Q6J("ngForOf",e)}}let U=(()=>{class n{constructor(e){this.portfolioService=e}}return n.\u0275fac=function(e){return new(e||n)(t.Y36(h))},n.\u0275cmp=t.Xpm({type:n,selectors:[["app-portfolio"]],standalone:!0,features:[t._Bn([h]),t.jDz],decls:9,vars:3,consts:[["id","portfolio",1,"section"],["class","projects",4,"ngIf"],[1,"projects"],["class","project",4,"ngFor","ngForOf"],[1,"project"],["target","_blank",3,"href"],["fontSet","fa","fontIcon","fa-code"],["fontSet","fa","fontIcon","fa-star"],["fontSet","fa","fontIcon","fa-code-branch"]],template:function(e,i){1&e&&(t.TgZ(0,"section",0)(1,"div")(2,"header")(3,"h2"),t._uU(4,"Project Gallery"),t.qZA()(),t.TgZ(5,"p"),t._uU(6,"In addition to cutting edge code, I bring a solid background in SEO, Branding and Online Marketing."),t.qZA(),t.YNc(7,S,2,1,"div",1),t.ALo(8,"async"),t.qZA()()),2&e&&(t.xp6(7),t.Q6J("ngIf",t.lcZ(8,1,i.portfolioService.projects$)))},dependencies:[d.JF,l.ez,l.sg,l.O5,l.Ov],styles:["#portfolio[_ngcontent-%COMP%]   .projects[_ngcontent-%COMP%]{display:flex;flex-wrap:wrap;justify-content:space-between}#portfolio[_ngcontent-%COMP%]   .projects[_ngcontent-%COMP%]   .project[_ngcontent-%COMP%]{max-width:350px}#portfolio[_ngcontent-%COMP%]   .projects[_ngcontent-%COMP%]   .project[_ngcontent-%COMP%]   span[_ngcontent-%COMP%]{margin-right:1rem}"],changeDetection:0}),n})(),A=(()=>{class n{}return n.\u0275fac=function(e){return new(e||n)},n.\u0275cmp=t.Xpm({type:n,selectors:[["app-home"]],standalone:!0,features:[t.jDz],decls:4,vars:0,template:function(e,i){1&e&&t._UZ(0,"app-intro")(1,"app-portfolio")(2,"app-biography")(3,"app-contact")},dependencies:[v,y,U,C],changeDetection:0}),n})()}}]);