package models

import (
	"strings"

	"github.com/grafana/grafana/pkg/log"
	"github.com/grafana/grafana/pkg/services/session"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/prometheus/client_golang/prometheus"
	"gopkg.in/macaron.v1"
)

type UserAuthToken struct {
	Id            int64
	UserId        int64
	AuthToken     string
	PrevAuthToken string
	UserAgent     string
	ClientIp      string
	AuthTokenSeen bool
	SeenAt        int64
	RotatedAt     int64
	CreatedAt     int64
	UpdatedAt     int64
	UnhashedToken string `xorm:"-"`
}

type ReqContext struct {
	*macaron.Context
	*SignedInUser
	UserToken *UserAuthToken

	Session session.SessionStore

	IsSignedIn     bool
	IsRenderCall   bool
	AllowAnonymous bool
	SkipCache      bool
	Logger         log.Logger
}

// Handle handles and logs error by given status.
func (ctx *ReqContext) Handle(status int, title string, err error) {
	if err != nil {
		ctx.Logger.Error(title, "error", err)
		if setting.Env != setting.PROD {
			ctx.Data["ErrorMsg"] = err
		}
	}

	ctx.Data["Title"] = title
	ctx.Data["AppSubUrl"] = setting.AppSubUrl
	ctx.Data["Theme"] = "dark"

	ctx.HTML(status, setting.ERR_TEMPLATE_NAME)
}

func (ctx *ReqContext) JsonOK(message string) {
	resp := make(map[string]interface{})
	resp["message"] = message
	ctx.JSON(200, resp)
}

func (ctx *ReqContext) IsApiRequest() bool {
	return strings.HasPrefix(ctx.Req.URL.Path, "/api")
}

func (ctx *ReqContext) JsonApiErr(status int, message string, err error) {
	resp := make(map[string]interface{})

	if err != nil {
		ctx.Logger.Error(message, "error", err)
		if setting.Env != setting.PROD {
			resp["error"] = err.Error()
		}
	}

	switch status {
	case 404:
		resp["message"] = "Not Found"
	case 500:
		resp["message"] = "Internal Server Error"
	}

	if message != "" {
		resp["message"] = message
	}

	ctx.JSON(status, resp)
}

func (ctx *ReqContext) HasUserRole(role RoleType) bool {
	return ctx.OrgRole.Includes(role)
}

func (ctx *ReqContext) HasHelpFlag(flag HelpFlags1) bool {
	return ctx.HelpFlags1.HasFlag(flag)
}

func (ctx *ReqContext) TimeRequest(timer prometheus.Summary) {
	ctx.Data["perfmon.timer"] = timer
}
