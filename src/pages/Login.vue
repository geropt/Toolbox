<template>
  <div
    class="login-page window-height window-width column items-center no-wrap"
    :class="$route.params.token ? 'bg-black' : 'bg-black'"
  >
    <div class="login-back flex items-center justify-center">
      <div class="login-code flex justify-center">
        <div v-if="!$route.params.token">
          <!-- Espacio reservado para el logo del usuario -->
          <div class="logo-container flex items-center justify-center">
            <!-- El usuario puede agregar su logo aquí -->
          </div>
        </div>
        <div v-else>
          <!-- Espacio para logo personalizado durante la carga -->
          <div
            class="loading-container flex column items-center justify-center"
          >
            <!-- El usuario puede agregar su logo aquí también -->
            <div
              class="custom-logo-loading flex items-center justify-center q-mb-lg"
            >
              <!-- Logo personalizado durante la carga -->
            </div>
            <q-circular-progress
              indeterminate
              color="white"
              size="60px"
              :thickness="0.2"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import { mapActions, mapMutations, mapState } from "vuex";

export default {
  data() {
    return {
      token: "",
      icons: {
        facebook: "mdi-facebook-box",
        google: "mdi-google-plus-box",
        live: "mdi-windows",
        github: "mdi-github-box",
        email: "mdi-at",
      },
      canLogin: true,
    };
  },
  computed: {
    ...mapState({
      sessionSettings: (state) => state.sessionSettings,
    }),
    model: {
      get() {
        return this.token;
      },
      set(val) {
        this.token = val;
      },
    },
    tokenInfo() {
      return this.$store.state.tokenInfo;
    },
  },
  methods: {
    ...mapActions(["initConnection"]),
    ...mapMutations(["setRegions", "setToken", "setToolboxSessionSettings"]),
    goto(to) {
      if (this.tokenInfo) {
        this.$router.push(to).catch((err) => err);
      } else {
        let connectEventIndex = false,
          errorEventIndex = false;
        const eventHandler = () => {
          this.$router.push(to).catch((err) => err);
          connectEventIndex &&
            Vue.connector.socket.off("connect", connectEventIndex);
          errorEventIndex && Vue.connector.socket.off("error", errorEventIndex);
        };
        connectEventIndex = Vue.connector.socket.on("connect", eventHandler);
        errorEventIndex = Vue.connector.socket.on("error", eventHandler);
      }
    },
    logIn(region) {
      this.initConnection({ token: this.token, region }).then(() => {
        this.$nextTick(() => {
          if (this.$route.params && this.$route.params.goto) {
            this.goto(this.$route.params.goto);
          } else {
            this.goto("/");
          }
        });
      });
    },
    autoLogin() {
      this.initConnection({ token: this.$route.params.token }).then(() => {
        this.goto("/");
      });
    },
    checkHasToken() {
      const sessionSettings = this.sessionSettings || {};
      const sessionStorageToken = sessionSettings.token;
      const sessionStorageRegion = sessionSettings.region;
      if (this.$route.params && this.$route.params.token) {
        this.autoLogin();
      } else if (sessionStorageToken) {
        this.token = sessionStorageToken;
        this.logIn(sessionStorageRegion);
      }
    },
    openWindow(url, title = "auth") {
      const w = 500,
        h = 600;
      const dualScreenLeft =
        window.screenLeft !== undefined ? window.screenLeft : screen.left;
      const dualScreenTop =
        window.screenTop !== undefined ? window.screenTop : screen.top;

      const width = window.innerWidth
        ? window.innerWidth
        : document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : screen.width;
      const height = window.innerHeight
        ? window.innerHeight
        : document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : screen.height;

      const left = width / 2 - w / 2 + dualScreenLeft;
      const top = height / 2 - h / 2 + dualScreenTop;
      const newWindow = window.open(
        url,
        title,
        "toolbar=no,location=no,status=yes,resizable=yes,scrollbars=yes, width=" +
          w +
          ", height=" +
          h +
          ", top=" +
          top +
          ", left=" +
          left
      );

      // Puts focus on the newWindow
      if (window.focus) {
        newWindow.focus();
      }
    },
    regionInitFromAuth(region) {
      this.setRegions({ [region.name]: region });
      this.setToolboxSessionSettings({ region });
      this.$connector.setRegion(region);
    },
  },
  watch: {
    $route(val) {
      if (val.params && val.params.token) {
        this.autoLogin();
      }
    },
  },
  created() {
    if (this.sessionSettings && this.sessionSettings.isVisibleToolbar) {
      this.canLogin = this.sessionSettings.isVisibleToolbar;
    }
    const tokenHandler = (event) => {
      if (
        typeof event.data === "string" &&
        ~event.data.indexOf("FlespiLogin|token:")
      ) {
        window.removeEventListener("message", tokenHandler);
        let payload = event.data;
        payload = payload.replace("FlespiLogin|token:", "");
        payload = JSON.parse(payload);
        this.token = payload.token;
        this.logIn(payload.region);
      }
    };
    window.addEventListener("message", tokenHandler);
    this.checkHasToken();
  },
};
</script>

<style lang="stylus">
.row__wrapper
  height 80px
.login-page
  &.bg-black
    background-color #000
    .login-back
      background-color #000
      background-image none
  .login-back
    width 100%
    height 100vh
    overflow hidden
    padding-top 15vh
    background-image url(../../public/mountain.svg)
    background-position center 100px
    background-size contain
    background-repeat no-repeat
    background-color #333
    color rgba(255,255,255,0.7)
    .login-code
      width: 80vw;
      max-width: 600px;
  .logo-container
    width 80vw
    max-width 600px
    height 50vh
    min-height 300px
  .loading-container
    width 80vw
    max-width 600px
    height 50vh
    min-height 300px
  .custom-logo-loading
    width 100%
    height 200px
    min-height 150px
</style>
