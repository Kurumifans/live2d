class L2D {
    constructor (pixiApp) {
        //this.basePath = basePath;
        this.app = pixiApp;
        this.loader = new PIXI.loaders.Loader();
        this.animatorBuilder = new LIVE2DCUBISMFRAMEWORK.AnimatorBuilder();
        this.timeScale = 1;
        this.app.ticker.add((deltaTime) => {
            if (!this.model) {
                return;
            }
            var scale;
            this.model.update(deltaTime);
            window.innerWidth > window.innerHeight ? scale = innerHeight : scale = innerWidth 
            this.model.scale.x = scale;
            this.model.scale.y = scale;
            this.model.masks.update(this.app.renderer);
        });
        window.onresize = (event) => {
            if (event === void 0) { event = null; }
            let width = window.innerWidth;
            let height = window.innerHeight;//(width / 16.0) * 9.0;
            this.app.view.style.width = width + "px";
            this.app.view.style.height = height + "px";
            this.app.renderer.resize(width, height);

            if (this.model) {
                this.model.position = new PIXI.Point((width * 0.5), (height * 0.5));
                //this.model.scale = new PIXI.Point((this.model.position.x * 1), (this.model.position.x * 1));
                //console.log(new PIXI.Point((this.model.position.x * 1), (this.model.position.x * 1)));
                //this.model.masks.resize(this.app.view.width, this.app.view.height);
            }
        };
        this.isClick = false;
        this.app.view.addEventListener('mousedown', (event) => {
            //console.log(event)
            this.mouse_x = event.offsetX;
            this.mouse_y = event.offsetY;
            this.isClick = true;
        });
        this.app.view.addEventListener('mousemove', (event) => {
            if (this.isClick) {        
                //console.log(this.model.position.x, event.offsetX, mouse_x)
                this.model.position.x += event.offsetX - this.mouse_x;
                this.model.position.y += event.offsetY - this.mouse_y; 
                //console.log(this.model.position);      
                this.mouse_x = event.offsetX;
                this.mouse_y = event.offsetY;
                //this.model.position = new PIXI.Point((this.model.position.x * 0.05), (this.model.position.y * 0.05));
                /*this.isClick = false;
                if (this.model) {
                    this.model.inDrag = true;
                }*/
            }

            /*if (this.model) {
                let mouse_x = this.model.position.x - event.offsetX;
                let mouse_y = this.model.position.y - event.offsetY;
                this.model.pointerX = -mouse_x / this.app.view.height;
                this.model.pointerY = -mouse_y / this.app.view.width;
            }*/
        });
        this.app.view.addEventListener('mouseup', (event) => {
            if (!this.model) {
                return;
            }

            if (this.isClick) {
                if (this.isHit('HitArea', event.offsetX, event.offsetY)) {
                    console.log('Touch Head');
                    this.startAnimation("touch_head", "base");
                } else if (this.isHit('HitArea2', event.offsetX, event.offsetY)) {
                    console.log('Touch Breasts');
                    this.startAnimation("touch_special", "base");
                } else if (this.isHit('HitArea3', event.offsetX, event.offsetY)) {
                    console.log('Touch Back');
                    this.startAnimation("touch_special", "base");
                } else {
                    //const bodyMotions = ["touch_body", "main_1", "main_2", "main_3"];
                    //let currentMotion = bodyMotions[Math.floor(Math.random()*bodyMotions.length)];
                    //this.startAnimation(currentMotion, "base");
                }
            }

            this.isClick = false;
            this.model.inDrag = false;
        });
        //this.models = {};
    }
    
    setPhysics3Json (value) {
        if (!this.physicsRigBuilder) {
            this.physicsRigBuilder = new LIVE2DCUBISMFRAMEWORK.PhysicsRigBuilder();
        }
        this.physicsRigBuilder.setPhysics3Json(value);

        return this;
    }
    
    load (url) {
        let modelDir = url.substr(0, url.lastIndexOf("/")) + "/";
        let textures = new Array();
        let textureCount = 0;
        let motionNames = new Array();

        this.loader.add(name+'_model', url.replace(".moc3", ".model3.json"), { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });

        this.loader.load((loader, resources) => {
            let model3Obj = resources[name+'_model'].data;
            
            if (typeof(model3Obj['FileReferences']['Moc']) !== "undefined") {
                loader.add(name+'_moc', modelDir+model3Obj['FileReferences']['Moc'], { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER });
            }

            if (typeof(model3Obj['FileReferences']['Textures']) !== "undefined") {
                model3Obj['FileReferences']['Textures'].forEach((element) => {
                    loader.add(name+'_texture'+textureCount, modelDir+element);
                    textureCount++;
                });
            }

            if (typeof(model3Obj['FileReferences']['Physics']) !== "undefined") {
                loader.add(name+'_physics', modelDir+model3Obj['FileReferences']['Physics'], { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });
            }

            if (typeof(model3Obj['FileReferences']['Motions']) !== "undefined") {
                for (let group in model3Obj['FileReferences']['Motions']) {
                    model3Obj['FileReferences']['Motions'][group].forEach((element) => {
                        let motionName = element['File'].split('/').pop().split('.').shift();
                        loader.add(name+'_'+motionName, modelDir+element['File'], { xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON });
                        motionNames.push(name+'_'+motionName);
                    });
                }
            }

            let groups = null;
            if (typeof(model3Obj['Groups'] !== "undefined")) {
                groups = LIVE2DCUBISMFRAMEWORK.Groups.fromModel3Json(model3Obj);
            }

            loader.load((l, r) => {
                let moc = null;
                if (typeof(r[name+'_moc']) !== "undefined") {
                    moc = Live2DCubismCore.Moc.fromArrayBuffer(r[name+'_moc'].data);
                }

                if (typeof(r[name+'_texture'+0]) !== "undefined") {
                    for (let i = 0; i < textureCount; i++) {
                        textures.splice(i, 0, r[name+'_texture'+i].texture);
                    }
                }

                if (typeof(r[name+'_physics']) !== "undefined") {
                    this.setPhysics3Json(r[name+'_physics'].data);
                }

                let motions = new Map();
                motionNames.forEach((element) => {
                    let n = element.split(name+'_').pop();
                    motions.set(n, LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(r[element].data));
                });

                let model = null;
                let coreModel = Live2DCubismCore.Model.fromMoc(moc);
                if (coreModel == null) {
                    return;
                }

                let animator = this.animatorBuilder
                    .setTarget(coreModel)
                    .setTimeScale(this.timeScale)
                    .build();

                let physicsRig = this.physicsRigBuilder
                    .setTarget(coreModel)
                    .setTimeScale(this.timeScale)
                    .build();

                let userData = null;

                model = LIVE2DCUBISMPIXI.Model._create(coreModel, textures, animator, physicsRig, userData, groups);
                model.motions = motions;
                //this.models[name] = model;

                this.playCanvas(model);
            });
            });
        
    }
    playCanvas (model) {
        this.model = model;
        this.model.update = this.onUpdate; // HACK: use hacked update fn for drag support
        // console.log(this.model);
        this.model.animator.addLayer("base", LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1);

        this.app.stage.addChild(this.model);
        this.app.stage.addChild(this.model.masks);

        window.onresize();
    }
    onUpdate (delta) {
        let deltaTime = 0.016 * delta;

        if (!this.animator.isPlaying) {
            let m = this.motions.get("idle");
            this.animator.getLayer("base").play(m);
        }
        this._animator.updateAndEvaluate(deltaTime);

        if (this.inDrag) {
            this.addParameterValueById("ParamAngleX", this.pointerX * 30);
            this.addParameterValueById("ParamAngleY", -this.pointerY * 30);
            this.addParameterValueById("ParamBodyAngleX", this.pointerX * 10);
            this.addParameterValueById("ParamBodyAngleY", -this.pointerY * 10);
            this.addParameterValueById("ParamEyeBallX", this.pointerX);
            this.addParameterValueById("ParamEyeBallY", -this.pointerY);
        }

        if (this._physicsRig) {
            this._physicsRig.updateAndEvaluate(deltaTime);
        }

        this._coreModel.update();

        let sort = false;
        for (let m = 0; m < this._meshes.length; ++m) {
            this._meshes[m].alpha = this._coreModel.drawables.opacities[m];
            this._meshes[m].visible = Live2DCubismCore.Utils.hasIsVisibleBit(this._coreModel.drawables.dynamicFlags[m]);
            if (Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
                this._meshes[m].vertices = this._coreModel.drawables.vertexPositions[m];
                this._meshes[m].dirtyVertex = true;
            }
            if (Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
                sort = true;
            }
        }

        if (sort) {
            this.children.sort((a, b) => {
                let aIndex = this._meshes.indexOf(a);
                let bIndex = this._meshes.indexOf(b);
                let aRenderOrder = this._coreModel.drawables.renderOrders[aIndex];
                let bRenderOrder = this._coreModel.drawables.renderOrders[bIndex];

                return aRenderOrder - bRenderOrder;
            });
        }

        this._coreModel.drawables.resetDynamicFlags();
    }
    startAnimation (motionId, layerId) {
        if (!this.model) {
            return;
        }

        let m = this.model.motions.get(motionId);
        if (!m) {
            return;
        }

        let l = this.model.animator.getLayer(layerId);
        if (!l) {
            return;
        }
        if(this.audio) this.audio.pause()
            let name = findGetParameter('file');
      let mmotions = JSON.parse(httpGet("assets/" + name + "/" + name + '.model3.json'));
      
      /*for(var i in mmotions.FileReferences.Motions) {
        if(i.toLowerCase() == motionId) {
          if(mmotions.FileReferences.Motions[i][0].Sound) {
            let audioPath = 'assets/'+ mmotions.FileReferences.Motions[i][0].Sound;
            this.audio = new Audio(audioPath);
            this.audio.play()
            
            this.audio.addEventListener('canplay', function() {l.play(m)}, false);
            break;
          } else l.play(m);
        }
      }*/
    l.play(m);
    }

    isHit (id, posX, posY) {
        if (!this.model) {
            return false;
        }

        let m = this.model.getModelMeshById(id);
        if (!m) {
            return false;
        }

        const vertexOffset = 0;
        const vertexStep = 2;
        const vertices = m.vertices;

        let left = vertices[0];
        let right = vertices[0];
        let top = vertices[1];
        let bottom = vertices[1];

        for (let i = 1; i < 4; ++i) {
            let x = vertices[vertexOffset + i * vertexStep];
            let y = vertices[vertexOffset + i * vertexStep + 1];

            if (x < left) {
                left = x;
            }
            if (x > right) {
                right = x;
            }
            if (y < top) {
                top = y;
            }
            if (y > bottom) {
                bottom = y;
            }
        }

        let mouse_x = m.worldTransform.tx - posX;
        let mouse_y = m.worldTransform.ty - posY;
        let tx = -mouse_x / m.worldTransform.a;
        let ty = -mouse_y / m.worldTransform.d;

        return ((left <= tx) && (tx <= right) && (top <= ty) && (ty <= bottom));
    }
}
